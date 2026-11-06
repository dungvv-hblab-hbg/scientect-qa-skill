# Hướng dẫn dùng Scientec QA Harness (từ đầu tới cuối)

*(English version: [TUTORIAL.en.md](TUTORIAL.en.md))*

Tài liệu này dành cho **người mới nhận harness** — QA hoặc dev kiêm QA, chưa từng chạy
lệnh `/qa-*` nào. Nó đi hết một vòng đời của một tính năng: từ file spec Markdown, tới
lúc bug report đã được ghi ra file và bản deploy production đã được verify.

Đọc kèm khi cần: [README.md](../README.md) (tổng quan + ngân sách token) ·
[TESTING.md](TESTING.md) (test chính harness + bảng chẩn đoán) ·
[DEAD-ENDS.md](DEAD-ENDS.md) (những ngõ cụt đã đi, đừng thử lại).

---

## 0. Harness này làm gì cho bạn

Một chuỗi slash command chạy trong **Claude Code**, biến một file spec Markdown thành
bộ tài liệu QA hoàn chỉnh:

```
specs/INV-001.md
   │  /qa-analyze          → checklist phân tích (.md)
   │  ▸ BẠN REVIEW                                         (điểm dừng 1)
   │  /qa-apply-feedback   → checklist đã sửa
   │  ▸ BẠN REVIEW LẠI                                     (điểm dừng 2)
   │  /qa-write-cases      → test case Excel 8 sheet
   │  ▸ BẠN REVIEW                                         (điểm dừng 3)
   │  /qa-run              → kết quả Pass/Fail + sheet Defects
   │  ▸ BẠN REVIEW                                         (điểm dừng 4)
   │  /qa-export-bugs      → bugs_INV-001.md + Bug ID trong Excel
   │  ▸ BẠN DUYỆT CẢ LÔ (trước khi ghi)                    (điểm dừng 5)
   ▼
 deploy production
   │  /qa-verify-prod      → báo cáo verify sau deploy
```

**Spec là nguồn duy nhất.** Harness không đọc code, không đọc git, không nối vào bug
tracker nào. Spec mỏng quá thì nó dừng và liệt kê chỗ thiếu, không tự đoán.

Ba loại thành phần:

| Loại | Là gì | Ví dụ |
|---|---|---|
| **Command** (`.claude/commands/`) | điểm vào, chạy trong session chính — **hỏi bạn được** | `/qa-run` |
| **Agent** (`.claude/agents/`) | subagent làm một chặng rồi kết thúc — **không dừng chờ bạn** | `test-runner` |
| **Skill** (`.claude/skills/`) | tri thức tĩnh, nạp theo nhu cầu | `common-validate` |

Mọi câu hỏi đều do **command** hỏi, gộp vào **một lượt** trước khi agent chạy. Ba mức:
**Chặn** (phải trả lời) · **Xác nhận** (có mặc định, chờ bạn gật) · **Tự quyết** (agent
làm, nhưng liệt kê trong tổng kết).

---

## 1. Cài (một lần cho mỗi repo)

Cần: Claude Code, Python 3, Node 20+, LibreOffice (tuỳ chọn — thiếu thì ô Summary trống
tới khi mở bằng Excel). Connector Figma là **tuỳ chọn**, chỉ dùng khi spec có link Figma.

```bash
git clone https://github.com/dungvv-hblab-hbg/scientect-qa-skill.git
cd scientect-qa-skill
./install.sh /đường/dẫn/repo-cua-ban --dry-run   # xem trước
./install.sh /đường/dẫn/repo-cua-ban             # làm thật (--with-e2e: copy luôn scientec-e2e/)
```

Trong repo đích, mở Claude Code:

```
/qa-setup
```

Nó soát Python + openpyxl, chromium, MCP Playwright, LibreOffice, dựng project e2e hợp
với repo, **xin duyệt một lượt** rồi mới cài. Sau đó:

```bash
cp <project e2e>/.env.example <project e2e>/.env
# BASE_URL, SCIENTEC_USER, SCIENTEC_PASS
# (verify prod) PROD_BASE_URL, SCIENTEC_PROD_USER, SCIENTEC_PROD_PASS
bash .claude/scripts/smoke-scripts.sh            # ~30 giây, phải xanh
```

> **URL đang là tạm:** `https://scientec-staging.example.com` (staging) và
> `https://scientec.example.com` (production). Thay bằng URL thật trong `.env` và mục
> `project` của `.claude/qa-config.md` trước khi chạy `/qa-run`.

> **Mật khẩu chỉ nằm trong `.env`.** Harness không bao giờ hỏi mật khẩu qua chat và
> không điền form login bằng MCP — đăng nhập luôn đi qua script Node riêng.

Ba cái bẫy lúc cài (chi tiết ở [README.md](../README.md)): sửa `.mcp.json` xong phải
**thoát Claude Code và mở lại** · chỉ giữ **một** bản Playwright MCP ở scope project ·
đừng `pip install openpyxl` trần, dùng venv `.claude/.venv`.

---

## 2. Chuẩn bị file spec

Ví dụ xuyên suốt: **`specs/INV-001.md`** — một tính năng tạo hoá đơn.

```markdown
# INV-001 — Tạo hoá đơn

## Mô tả
Kế toán tạo hoá đơn mới cho khách hàng từ màn Invoices.

## Vai trò
- Accountant: tạo, sửa hoá đơn nháp
- Viewer: chỉ xem

## Acceptance criteria
1. Nút "New invoice" chỉ hiện với Accountant.
2. Customer và Issue date là bắt buộc; thiếu thì hiện "This field is required."
3. Invoice number tối đa 20 ký tự.
4. Lưu thành công thì hoá đơn ở trạng thái Draft và hiện trong danh sách.

## Design
https://www.figma.com/file/... (tuỳ chọn)
```

Spec càng có AC rõ, message nguyên văn, ràng buộc field cụ thể thì checklist càng ít câu
hỏi. Thiếu ràng buộc nào (VD maxlength) thì harness **hỏi**, không lấy 255 làm mặc định.

---

## 3. Chạy một tính năng — từng bước

Mẹo chung: mở **terminal thứ hai** để theo dõi tiến trình:

```bash
tail -f .qa/INV-001/progress.log
```

### Bước 0 — `/qa-login` (khi cần)

Đăng nhập một lần, lưu session vào `.playwright-mcp-profile/` cho các lần `/qa-run` sau.
Chạy lần đầu, hoặc khi `/qa-run` báo đang ở trang login. `/qa-login prod` cho production.

Script đọc `.env` trong tiến trình riêng, mật khẩu không qua chat. Gặp `2FA_REQUIRED`
thì tự nhập mã trong cửa sổ trình duyệt rồi gõ **`ok`**. **Seed TRƯỚC khi gọi bất kỳ tool
MCP nào** — MCP mở browser là giữ lock profile; lỡ rồi thì thoát Claude Code và mở lại.

### Bước 1 — `/qa-analyze specs/INV-001.md`

| | |
|---|---|
| **Đầu vào** | đường dẫn file spec `.md` · (tuỳ chọn) ID ở tham số thứ hai |
| **Đầu ra** | `.qa/INV-001/spec.md` (bản chụp spec) · `.qa/INV-001/checklist_INV-001.md` |

Nó hỏi (một lượt): xác nhận **feature ID** (mặc định `INV-001` từ tên file) và — nếu
checklist đã có — ghi đè hay dừng.

- File không tồn tại / không phải `.md` → dừng. Spec ở Word/PDF thì tự chuyển sang `.md`.
- **Dán spec vào chat thay vì đưa file** → nó đề nghị lưu thành `specs/<ID>.md`, cho bạn
  xem nguyên văn, **chờ OK** rồi ghi và chạy tiếp. Không phân tích nội dung chat trần.
- Spec quá mỏng → `SPEC_INSUFFICIENT`: không ra checklist, chỉ ra danh sách chỗ thiếu
  dạng câu hỏi mang đi hỏi BA/khách. Bổ sung spec rồi chạy lại.

Agent `test-analyst` đọc spec (và Figma nếu có) rồi dựng checklist mục A → G:

| Mục | Nội dung |
|---|---|
| A | Nguồn đã đọc (file spec, Figma) |
| B | Overview tính năng |
| C | Detail từng phần, chia theo màn hình |
| D | Bảng tổng hợp — D1 ràng buộc field, D2 message, D5 mâu thuẫn trong spec… |
| E / E2 | Bảng có điều kiện (VD role × quyền) · **bảng AC** (nguồn của sheet Traceability) |
| F | Giả định & câu hỏi cho BA, kèm **độ tin** Cao/Trung/Thấp |
| G | Kế hoạch test *(chỉ khi dự kiến trên 15 case)* |

**Bạn làm gì:** đọc file. Cần sửa → ghi vào section **"Phản hồi review"** ở cuối, tham
chiếu **bằng số**: `#4 sai — maxlength thật là 20`, rồi sang bước 2. Ổn → nhảy bước 3.

### Bước 2 — `/qa-apply-feedback INV-001` *(chỉ khi có phản hồi)*

Áp phản hồi ngay trong session chính (không subagent — phản hồi mơ hồ thì cần hỏi lại).
**Giữ nguyên số đã gán**; mục mới append số tiếp theo ở cuối; mục bỏ thì gạch, không tái
dùng số. Phản hồi đã xử lý được chuyển xuống `## Đã xử lý (ngày)`, không xoá.

**Bạn làm gì:** review lại. Còn câu hỏi độ tin **Thấp** ở mục F thì chưa nên viết test case.

### Bước 3 — `/qa-write-cases INV-001`

| | |
|---|---|
| **Đầu vào** | checklist đã review |
| **Đầu ra** | `.qa/INV-001/TCs_<Module>_v<ver>.xlsx` — 8 sheet |

Nó **chặn** khi checklist còn phản hồi chưa xử lý, còn câu hỏi độ tin Thấp, hoặc thiếu
ràng buộc/message thật mà test cần. Nó **xin xác nhận** module, version, tên file.

8 sheet: `Cover · Summary · Test Cases · Test Cases_VN · Common Validate · Defects &
Follow-ups · Traceability · Assumptions & Questions`. Sheet `Test Cases` (EN) là nguồn
chân lý. ID reset theo section (`TC-A-001`, `TC-B-001`). Nhãn đầu cột Note:
`[MANUAL] <lý do>` và `[DATA-REQ] <điều kiện>`. Sheet **Traceability** còn `MISSING` là có
AC chưa được phủ — lỗ hổng thật.

**Bạn làm gì:** mở file, sửa/thêm/bớt case.

### Bước 4 — `/qa-run INV-001`

| | |
|---|---|
| **Đầu vào** | file `.xlsx` đã review · session đăng nhập · MCP Playwright |
| **Đầu ra** | Result trong Excel · sheet Defects · `scientec-e2e/tests/INV-001.spec.ts` · ảnh ở `.qa/INV-001/phase1/` |

Nó hỏi (một lượt): **tính năng đã deploy lên staging chưa** (harness không tự kiểm được —
chưa lên thì dừng), file `.xlsx` nào, ghi Round 1 hay Round 2, test data đặc biệt, rồi
kiểm MCP, session, `.env`, Postman. Lần trước đứt giữa chừng thì đề xuất **tiếp tục**.

Case chia ba nhánh: **UI** (Playwright), **API** (newman — `CHƯA CÓ` collection thì skip
gọn), **Manual** (`Blocked` + `[MANUAL]`). Case UI chưa có spec `.ts` thì đi **Phase 1** —
agent dò bằng MCP (cửa sổ hiện lên, đừng bấm vào), rồi export sang `tests/INV-001.spec.ts`
để lần sau chạy bằng code.

**Bạn làm gì:** mở file, vào sheet **Defects & Follow-ups**: sửa Actual nếu chưa đúng;
case không muốn ghi bug → **Fix Status = `Won't fix`**. **ĐỪNG XOÁ DÒNG.** Lưu file.

### Bước 5 — `/qa-export-bugs INV-001`

| | |
|---|---|
| **Đầu vào** | file `.xlsx` đã review và đã lưu |
| **Đầu ra** | `.qa/INV-001/bugs_INV-001.md` · Bug ID `BUG-INV-001-NNN` trong Excel |

Hai nửa, điểm duyệt ở giữa:

```
bug-writer                 ->  BẠN DUYỆT CẢ LÔ  ->  command ghi file
(đọc Defects, soạn nháp,                            (bugs_INV-001.md + writeback
 chống trùng, ghi bugs-draft_INV-001.md)             Bug ID vào Excel + recalc)
```

Nó hỏi: file nào, đã review + lưu sheet Defects chưa, staging URL cho mục Environment.
Rồi trình bảng `Draft ID · TC ID · Title · Priority · Trùng?`, kèm dòng bị loại và lý do.

**Bạn làm gì:** duyệt **một lần cho cả lô** — bỏ bớt, sửa title/priority trong cùng lượt
trả lời, hoặc sửa thẳng file nháp rồi gõ `ok`. Bug report viết tiếng Anh, không có
assignee, không gửi đi đâu: gửi `bugs_INV-001.md` cho dev là việc của bạn.

### Bước 6 — `/qa-verify-prod INV-001` *(sau khi dev fix và deploy)*

| | |
|---|---|
| **Đầu vào** | `scientec-e2e/tests/INV-001.spec.ts` · `.env` có `PROD_BASE_URL` + account prod |
| **Đầu ra** | `.qa/INV-001/prod-verify-<ngày>.md` |

Hỏi trước: **đã deploy lên production chưa**. Chạy bằng **code đã review, KHÔNG dùng
MCP**, và **chỉ case gắn `@prod-safe`** (chỉ xem, không ghi dữ liệu). Không có case nào
gắn tag → dừng, không báo xanh suông. Báo trước sẽ chạy bao nhiêu / tổng bao nhiêu case.
Regression (staging Pass, prod Fail) được nêu rõ; nó chỉ đề xuất, không tự ghi bug.

---

## 4. Lệnh phụ trợ

```
/qa-status              # mọi tính năng, mới nhất lên đầu
/qa-status INV-001      # từng chặng của một tính năng + nên chạy gì tiếp
/qa-doctor              # đọc-only: chẩn MCP trùng scope, .mcp.json lệch, rơi về /login
/qa-retro INV-001       # tuỳ chọn: soi chính harness sau một vòng chạy
```

`state.json` là **nhật ký, không phải nguồn chân lý** — `/qa-status` đối chiếu với file
thật trên đĩa và báo khi lệch.

---

## 5. Artifact sinh ra ở đâu

```
specs/INV-001.md                       spec gốc (bạn giữ, có thể còn sửa)
.qa/INV-001/
├─ spec.md                             bản chụp spec đúng phiên bản đã phân tích
├─ checklist_INV-001.md                ★ điểm dừng 1 và 2
├─ TCs_<Module>_v1.0.xlsx              ★ điểm dừng 3 và 4
├─ bugs-draft_INV-001.md               lô bug nháp chờ duyệt (xoá sau khi ghi xong)
├─ bugs_INV-001.md                     ★ bug report chính thức (điểm dừng 5)
├─ prod-verify-<ngày>.md               báo cáo verify production
├─ result.json                         report của newman (nhánh API)
├─ phase1/                             ảnh bằng chứng lúc dò bằng MCP
├─ progress.log                        tiến trình tới từng case
└─ state.json                          nhật ký chặng, cho /qa-status và resume

scientec-e2e/tests/INV-001.spec.ts     spec .ts export từ Phase 1, một file / một tính năng
.playwright-mcp-profile/               session của MCP (Phase 1)
scientec-e2e/playwright/.auth/         session của code (chạy spec) — TÁCH BIỆT
```

**Hai session là thiết kế, không phải lỗi** — biên bản ở [DEAD-ENDS.md](DEAD-ENDS.md) §1.

---

## 6. Ba cạm bẫy đã trả giá — đừng gỡ hàng rào

**Append, không lấp lỗ trống.** Dòng Defects mới ghi sau dòng *cuối cùng* có TC ID.

**Khoá theo TC ID, không theo số dòng.** Chèn/xoá dòng giữa `read` và `writeback` thì
số dòng lệch, TC ID thì không.

**Đừng dùng "xoá dòng" làm tín hiệu từ chối.** Dùng Fix Status = `Won't fix`.

---

## 7. Sự cố thường gặp

| Triệu chứng | Nguyên nhân | Xử |
|---|---|---|
| `/qa-analyze` không phân tích đoạn spec bạn dán | đúng thiết kế | đồng ý lưu thành `specs/<ID>.md` |
| `/qa-analyze` báo `SPEC_INSUFFICIENT` | spec thiếu AC / mô tả | bổ sung file spec rồi chạy lại |
| `/qa-run` dừng ở câu hỏi deploy | bạn chưa xác nhận tính năng đã lên staging | deploy xong rồi trả lời "đã deploy" |
| `browser_wait_for` timeout 5000ms | `.mcp.json` thiếu timeout hoặc bản MCP scope khác thắng | `/qa-doctor`, sửa rồi **mở lại Claude Code** |
| Seed xong vẫn ở `/login` | profile không được nạp (trùng scope MCP) | `/qa-doctor`, đừng lặp đăng nhập |
| Script seed báo profile bị chiếm | session đã gọi tool MCP trước | thoát Claude Code, chạy `/qa-login` **ngay từ đầu** |
| Ô Summary trống | chưa recalc (thiếu LibreOffice) | mở bằng Excel một lần, hoặc cài LibreOffice |
| Nhánh API bị skip | mục `postman` là `CHƯA CÓ` | đúng thiết kế |
| Traceability còn `MISSING` | có AC chưa được phủ | bổ sung case |

Bảng chẩn đoán đầy đủ: [TESTING.md](TESTING.md).

---

## 8. Tóm tắt một trang

```
/qa-login                              # khi cần session
/qa-analyze specs/INV-001.md           ▸ review checklist
/qa-apply-feedback INV-001             ▸ review lại (bỏ qua nếu không sửa gì)
/qa-write-cases INV-001                ▸ review file Excel
/qa-run INV-001                        ▸ review sheet Defects (Won't fix, đừng xoá dòng, lưu file)
/qa-export-bugs INV-001                ▸ duyệt cả lô bug → bugs_INV-001.md
# --- sau deploy production ---
/qa-verify-prod INV-001

/qa-status [INV-001]  ·  /qa-doctor  ·  tail -f .qa/INV-001/progress.log
```
