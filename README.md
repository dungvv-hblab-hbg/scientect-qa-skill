# Scientec QA Harness

Bộ agentic workflow cho quy trình QA của dự án **Scientec**, chạy trên **Claude Code**:

```
spec .md → checklist → test case Excel → chạy test (UI/API) → bug report (Excel + MD) → verify production
```

Mười một slash command, sáu subagent, bảy skill. Đầu vào là **một file spec Markdown có
sẵn** cho mỗi tính năng — harness không đọc code, không đọc git, không nối vào bug
tracker nào. (Tách ra từ harness QA của một dự án trước; xem [CHANGELOG.md](CHANGELOG.md).)

Người mới: đọc **[docs/TUTORIAL.md](docs/TUTORIAL.md)** — hướng dẫn từng bước, đầu vào
và đầu ra của mỗi chặng. Bản tiếng Anh: [docs/TUTORIAL.en.md](docs/TUTORIAL.en.md).

**Năm điểm dừng cho người**, không phải ba: sau checklist · sau khi áp phản hồi ·
sau file test case · sau sheet Defects · và duyệt cả lô bug trước khi ghi
`bugs_<ID>.md`. Harness không tự đi từ spec tới bug report mà không có ai gật.

> **URL môi trường đang là giá trị tạm.** `BASE_URL=https://scientec-staging.example.com`
> và `PROD_BASE_URL=https://scientec.example.com` — thay bằng URL thật của Scientec trong
> `.env` của project e2e và mục `project` của `.claude/qa-config.md` trước khi chạy
> `/qa-run`. Form đăng nhập mặc định trong `scientec-e2e/` cũng là giữ chỗ cho tới khi
> biết form thật.

---

## Cài đặt

### Yêu cầu

| Cần | Để làm gì | Kiểm |
|---|---|---|
| Claude Code | chạy command + agent | `claude --version` |
| Python 3 | `build.py`, `write_defects.py` | `python3 --version` |
| Node 20+ | project Playwright, MCP server | `node --version` |
| LibreOffice | `recalc.py` tính lại công thức Excel | `which soffice` |
| Connector Figma *(tuỳ chọn)* | đọc design khi spec có link Figma | `/mcp` trong Claude Code |

Không cần connector bug tracker nào. Thiếu Figma thì agent ghi `[Cần hỏi]` ở mục A của
checklist và chạy tiếp. LibreOffice thiếu **không chặn** — file Excel vẫn đúng, chỉ là
ô Summary trống tới khi mở bằng Excel một lần.

### Cài vào repo của bạn

```bash
git clone https://github.com/dungvv-hblab-hbg/scientect-qa-skill.git
cd scientect-qa-skill
./install.sh /đường/dẫn/repo-cua-ban            # thêm --dry-run để xem trước
```

Script copy `.claude/`, `.mcp.json` và append `gitignore.snippet` vào `.gitignore` của
repo đích. Repo đích đã có `.claude/` thì nó **dừng** thay vì ghi đè — merge tay, hoặc
`--force` nếu chắc chắn.

**Project e2e KHÔNG được copy mặc định.** Nó phụ thuộc app thật — URL, form đăng nhập,
tên biến môi trường, dữ liệu mẫu. Bê nguyên một project của app khác sang thì mọi
selector đều sai và `npm run check` đỏ ngay từ phút đầu, mà người mới cài không biết vì
sao. `/qa-setup` dò repo đích, hỏi bạn, rồi đi một trong ba nhánh (skill `e2e-scaffold`):

| Dò thấy | Làm gì |
|---|---|
| Đã có `playwright.config.*` | **vá** config sẵn có cho đủ hàng rào của harness, không dựng thêm |
| Chưa có, là app web | scaffold theo app thật của repo đó |
| Không phải app web / dùng framework khác | bỏ nhánh UI — `qa-config` ghi `KHÔNG DÙNG`, `/qa-run` vẫn chạy nhánh API + manual |

Repo đích là repo test của Scientec thì `--with-e2e` copy nguyên `scientec-e2e/` cho
nhanh — nhớ thay URL tạm và kiểm form đăng nhập.

### Bốn việc sau khi install

Mở Claude Code trong repo đó rồi:

```
/qa-setup
```

`/qa-setup` soát những gì đã có (Python + openpyxl, chromium, MCP Playwright,
LibreOffice, session e2e, Postman collection), **dựng project e2e hợp với repo này**
(dò trước, hỏi bạn, rồi mới làm), **xin duyệt một lượt** rồi mới cài, và liệt kê rõ
phần bạn phải tự làm.

Xong bước đó mới điền credential:

```bash
cd /đường/dẫn/repo-cua-ban
cp <project e2e>/.env.example <project e2e>/.env
# điền BASE_URL, SCIENTEC_USER / SCIENTEC_PASS
# (verify prod) PROD_BASE_URL, SCIENTEC_PROD_USER / SCIENTEC_PROD_PASS
```

Rồi soát **`.claude/qa-config.md`** — đặc biệt mục `project` (URL staging/production
đang là giá trị tạm). Cuối cùng kiểm nhanh:

```bash
bash .claude/scripts/smoke-scripts.sh
```

### Ba cái bẫy lúc cài

**Sửa `.mcp.json` xong phải thoát Claude Code và mở lại.** MCP server đọc args lúc khởi
động; sửa giữa session **không có tác dụng và không có tín hiệu nào báo** — tool vẫn
chạy, vẫn trả kết quả, chỉ là bằng cấu hình cũ.

**Chỉ giữ MỘT bản Playwright MCP, ở scope project.** Máy đã cài ở scope `local`/`user`
thì gỡ (`claude mcp list` rồi `claude mcp remove playwright -s local`). Hai bản cùng tồn
tại thì chỉ một thắng, và bản thắng có thể không mang `--user-data-dir` lẫn timeout — khi
đó seed profile xong vẫn rơi về `/login` mà không có lỗi nào báo.

**Đừng chạy `pip install openpyxl` trần.** Trên macOS (Homebrew) và Ubuntu 23+ nó thất
bại với `externally-managed-environment` (PEP 668). Dùng venv chuẩn — `/qa-setup` tự tạo:

```bash
python3 -m venv .claude/.venv && .claude/.venv/bin/python -m pip install openpyxl
```

Mọi script Python trong harness gọi qua `.claude/scripts/qa-py.sh`, wrapper tự chọn
interpreter có openpyxl (`.claude/.venv` → `$QA_PYTHON` → `.qa/.venv` → `python3`).

---

## Dùng

Mỗi tính năng có một **feature ID** (`[A-Za-z0-9_-]+`, VD `INV-001`). Mặc định ID = tên
file spec bỏ `.md`; truyền tham số thứ hai để dùng ID khác. Mọi output nằm ở `.qa/<ID>/`.

```
/qa-setup                       một lần cho repo mới (cài + dựng project e2e)
/qa-doctor                      chẩn môi trường & cấu hình, ĐỌC-ONLY — chạy khi thấy lạ
/qa-status                      đang ở đâu, tính năng nào dở dang, nên chạy gì tiếp
/qa-login                       đăng nhập vào profile MCP (chạy lại khi session hết hạn)

/qa-analyze specs/INV-001.md [INV-001]
    xác nhận ID -> chép spec vào .qa/INV-001/spec.md
    -> test-analyst (chỉ đọc spec + Figma nếu có)
    -> .qa/INV-001/checklist_INV-001.md
    ▸ DỪNG — bạn review, ghi phản hồi vào section "Phản hồi review"

    spec quá mỏng (không AC, không mô tả đủ) -> SPEC_INSUFFICIENT
    -> command DỪNG, liệt kê chỗ thiếu thành câu hỏi; bổ sung file spec rồi chạy lại
    dán spec vào chat thay vì đưa file -> đề nghị lưu thành specs/<ID>.md (chờ OK) rồi chạy tiếp

/qa-apply-feedback INV-001          (chỉ khi có ghi phản hồi — không sửa gì thì bỏ qua)
    áp phản hồi, giữ nguyên số thứ tự cũ
    ▸ DỪNG — review lại

/qa-write-cases INV-001
    checklist -> Excel 8 sheet + Traceability (AC -> TC)
    ▸ DỪNG — review file test case

/qa-run INV-001
    xác nhận tính năng đã lên staging -> phân case UI/API/Manual -> chạy
    -> ghi kết quả + sheet Defects
    ▸ DỪNG — review sheet Defects (Won't fix, đừng xoá dòng)

/qa-export-bugs INV-001
    bug-writer (đọc Defects, soạn nháp BUG-INV-001-NNN, chống trùng với bugs_INV-001.md)
    ▸ DỪNG — bạn duyệt cả lô bug
    command ghi .qa/INV-001/bugs_INV-001.md + writeback Bug ID vào Excel

/qa-retro INV-001                   (tuỳ chọn — soi HARNESS, không soi sản phẩm)
    retro-analyst ×2 SONG SONG, hai model, không đọc bài của nhau
    -> command đối chiếu + chạy lại "Lệnh kiểm" của TỪNG phát hiện
    -> .qa/INV-001/retro-<ngày>.md

--- sau khi dev fix và deploy lên production ---

/qa-verify-prod INV-001
    xác nhận đã deploy -> chạy lại spec .ts trên production bằng CODE, chỉ case @prod-safe
```

Quên đang làm dở tính năng nào?

```
/qa-status              # mọi tính năng, mới nhất lên đầu
/qa-status INV-001      # chi tiết từng chặng của một tính năng
```

Mỗi chặng xong ghi một dòng vào `.qa/<ID>/state.json`. Đó là **nhật ký, không phải
nguồn chân lý** — artifact trên đĩa mới là sự thật, nên `/qa-status` đối chiếu cả hai
và báo khi lệch (VD nhật ký nói đã sinh test case nhưng file `.xlsx` đã bị xoá). `.qa/`
đã gitignore nên trạng thái này **cục bộ theo máy**, không chia sẻ.

Theo dõi tiến trình bằng terminal thứ hai:

```bash
tail -f .qa/INV-001/progress.log
```

Log xuống tới từng case (`case 12/45 · TC-B-003 · đang chạy (11 xong: 9P 2F)`), và phần
chạy bằng `npx playwright test` cũng đổ vào cùng file.

---

## Cấu trúc repo

```
.claude/                          thứ được copy sang repo đích
├─ qa-config.md                   ĐIỂM KHAI BÁO DUY NHẤT — môi trường, path, bug report
├─ commands/                      11 slash command — điểm vào, chờ người dùng được
├─ agents/                        6 subagent — chạy một chặng rồi kết thúc
│  └─ reference/                  tri thức chỉ một nhánh cần (Phase 1 browser)
├─ skills/                        7 skill — tri thức tĩnh, nạp theo nhu cầu
└─ scripts/
   ├─ qa-log.sh                   in tiến trình + ghi progress.log
   ├─ qa-py.sh                    chọn interpreter Python có openpyxl
   ├─ qa-config.sh                in ĐÚNG MỘT mục của qa-config.md
   ├─ qa-state.sh                 nhật ký trạng thái từng chặng, để resume
   ├─ seed-mcp-profile.mjs        đăng nhập, mật khẩu không qua transcript
   └─ smoke-scripts.sh            assertion tầng script, không cần MCP

.mcp.json                         đăng ký Playwright MCP (copy sang repo đích)
gitignore.snippet                 install.sh append vào .gitignore repo đích
scientec-e2e/                     project Playwright của Scientec (URL + form login
                                  còn là giữ chỗ). install.sh KHÔNG copy trừ khi
                                  --with-e2e — /qa-setup dựng bản hợp với repo đích
install.sh                        cài vào repo đích
docs/TUTORIAL.md                  hướng dẫn dùng từng bước cho người mới
docs/TUTORIAL.en.md               bản tiếng Anh của TUTORIAL.md
docs/TESTING.md                   hướng dẫn test 4 tầng + bảng chẩn đoán lỗi
docs/DEAD-ENDS.md                 biên bản các ngõ cụt đã đi — đừng thử lại
evals/                            5 kịch bản đo từng chặng (tài liệu, không copy)
scripts/                          CI: lint-harness.py, check-gitignore.sh
CHANGELOG.md
```

Spec của từng tính năng để ở `specs/<ID>.md` trong repo đích (thư mục mặc định, đổi
được trong `qa-config.md`). Output của harness ở `.qa/<ID>/`, đã gitignore.

### Vì sao chia command / agent / skill

- **Command** chạy trong session chính nên **chờ người dùng được** — cổng đầu vào, xin
  duyệt, chờ nhập 2FA đều nằm ở đây.
- **Agent** là subagent: chạy một chặng rồi kết thúc, **không dừng chờ giữa chừng**.
  Agent mà "hỏi rồi đợi" thì thực chất là đứng im. Nên agent chỉ phát hiện và báo.
- **Skill** là tri thức tĩnh, không quyết định luồng. Nạp theo nhu cầu nên không tốn
  context ở những chặng không cần.

Không có `.claude/rules/`: rule không có `paths:` frontmatter được nạp vào **mọi
session** trong repo. Tri thức chỉ dùng cho một tác vụ thì để ở `skills/`.

---

## Nguyên tắc đã cài xuyên suốt

- **Spec Markdown là nguồn duy nhất, không đọc code.** "Hệ thống phải làm gì" chỉ lấy
  từ file spec (và Figma nếu spec có link). Spec dán trong chat thì lưu thành
  `specs/<ID>.md` trước — ba tháng sau không ai mở lại được nội dung chat. Spec quá
  mỏng thì `test-analyst` báo `SPEC_INSUFFICIENT` và dừng: checklist dựng từ suy đoán
  trông như thật nhưng không có gì bảo chứng, test sinh ra từ đó không bao giờ đỏ ở
  đúng chỗ cần đỏ. Bổ sung spec là việc của người viết spec, không phải của harness.
- **Năm điểm dừng cho người**: sau checklist · sau khi áp phản hồi · sau file test
  case · sau sheet Defects · duyệt cả lô bug. Điểm duyệt lô bug nằm ở **command** chứ
  không trong agent — subagent không dừng chờ người được, nên hàng rào đặt trong agent
  là hàng rào hỏng.
- **Thiếu đầu vào thì hỏi, không đoán.** Mỗi command mở đầu bằng cổng đầu vào, gộp mọi
  câu hỏi vào một lượt. Ba mức: *chặn* (không có mặc định an toàn), *xác nhận* (có mặc
  định nhưng mặc định vẫn là phán đoán), *tự quyết* (chuyên môn agent, phải liệt kê
  trong tổng kết).
- **Đo đúng bản đang chạy.** `/qa-run` test trên **staging** (`BASE_URL`),
  `/qa-verify-prod` trên **production** (`PROD_BASE_URL`). Harness không đọc được code
  hay pipeline deploy, nên cả hai **hỏi bạn xác nhận** tính năng đã lên đúng môi trường
  — test trên bản cũ vẫn ra số Pass nên sai này không tự lộ ra.
- **Production chỉ đọc.** Chặng verify chạy bằng code đã review, không dùng MCP, và chỉ
  chạy case gắn `@prod-safe`. Hàng rào nghiêng về phía bỏ sót: bỏ sót một case còn sửa
  được, sửa nhầm dữ liệu khách hàng thì không.
- **Con người bấm nút cuối.** Ghi bug report, cấp quyền MCP đều chờ duyệt — xin duyệt
  một lần cho cả lô, không hỏi từng cái.
- **Bug chỉ xuất file.** Sheet Defects + `.qa/<ID>/bugs_<ID>.md` (tiếng Anh, ID local
  `BUG-<ID>-NNN`). Không tạo gì ở công cụ ngoài; muốn đưa lên tracker thì người dùng tự
  mang file đi.
- **Truy vết hai chiều**: AC → TC (sheet Traceability) và TC ID → test tự động → kết quả
  → bug.
- **Artifact viết cho tester đọc**, không phải cho dev: câu ngắn, thao tác nhìn thấy
  được, không `H1`/`endpoint`/tên class trong phần UI.

---

## Ba cạm bẫy đã trả giá — đừng gỡ hàng rào

**Append, không lấp lỗ trống.** Dòng Defects mới ghi sau dòng *cuối cùng* có TC ID. Lấp
ô trống đầu tiên thì một dòng bị xoá ở giữa sẽ khiến lần fill sau đè mất các dòng bên
dưới, kèm Actual người dùng đã review.

**Khoá theo TC ID, không theo số dòng.** Người dùng chèn/xoá một dòng giữa `read` và
`writeback` là index lệch và Bug ID gắn nhầm case.

**Đừng dùng "xoá dòng" làm tín hiệu từ chối.** Muốn nói "case này không tạo bug", đặt
Fix Status = `Won't fix`. Xoá dòng không giữ được ý định: case vẫn Fail và chưa có Bug
ID nên lần fill sau nó quay lại.

---

## Ngân sách token

**Số liệu theo từng command chưa đo lại** sau khi tách sang Scientec (bỏ ba agent đọc
code/UI, gộp hai agent bug thành một, bỏ hai mục checklist). Hướng thay đổi là giảm,
nhưng đừng trích con số cũ. Đo lại bằng tokenizer thật, không ước theo ký tự.

| | Tokens |
|---|---|
| Luôn nạp mọi session (frontmatter của skill + agent + command) | chưa đo lại |
| Mỗi chặng `/qa-*` | chưa đo lại |

Mỗi chặng = command body + agent body + skill được gọi + reference bắt buộc + **đúng
mục `qa-config` mà chặng đó cần**. Đọc lại bằng:

```bash
bash .claude/scripts/qa-config.sh <mục>     # đừng cat cả qa-config.md
```

> **Đừng ước bằng "ký tự ÷ 3,5".** Đo thật trên `.claude/*.md` ra **3,22 ký tự/token**,
> và `wc -c` còn phồng thêm ~20% nữa vì tiếng Việt có dấu là 2 byte/ký tự. Muốn con số
> đúng thì `wc -m` rồi chia 3,22 — hoặc chạy tokenizer.
>
> **Dịch harness sang tiếng Anh không đáng.** Đo trên các cặp câu dịch đối chiếu: chỉ
> rẻ hơn **~11%**, và có câu còn đắt hơn. Tokenizer đời mới cover tốt dấu tiếng Việt,
> còn tiếng Việt lại diễn đạt cùng ý bằng ít ký tự hơn — hai thứ gần triệt tiêu nhau.
> 11% đó không bù được rủi ro trôi nghĩa ở các hàng rào đã trả giá, và artifact đầu ra
> (checklist, sheet `Test Cases_VN`) vẫn phải là tiếng Việt.

Bốn quy tắc giữ nó ở mức thấp:

1. **Trùng lặp giữa các file không bao giờ cùng nạp là MIỄN PHÍ.** Các command không
   bao giờ cùng nạp; các agent cũng vậy. Đừng gom thứ đã miễn phí vào file dùng chung —
   đó là cách file dùng chung phình lên rồi bị nạp ở mọi chặng.

   **Nhưng một command và agent nó gọi thì CÙNG một chặng**, và `qa-config.md` thì ở
   mọi chặng. Trùng lặp trong ba chỗ đó phải trả tiền hai, ba lần — đó là chỗ rò thật.
2. **Chi tiết chỉ dùng ở MỘT SỐ lần chạy thì vào `reference/`. Chi tiết dùng ở MỌI lần
   chạy thì để nguyên trong SKILL.md** — tách ra chỉ thêm một lượt Read mà không bớt
   token nào.

   Tách đúng: `common-validate` (mỗi lần chỉ đọc 1 trong 2 file) · `openpyxl-traps`
   (chỉ khi sửa script) · `agents/reference/phase1-browser.md` (chỉ khi còn case chưa
   có spec `.ts`). Tách sai sẽ là mục A–G của `checklist-format` — nó luôn cần cả cụm.

   Quy tắc này áp cho **cả agent**, không riêng skill.
3. **`description` chỉ để discovery** — nó nạp vào mọi session.
4. **Tài liệu cho người ở ngoài `.claude/`.** README, CHANGELOG, docs/, evals/ không
   được agent nạp; mọi dòng thêm vào `.claude/` đều có giá ở mỗi lần chạy. Kể cả
   trong `qa-config.md`: câu mệnh lệnh *"đừng làm X"* ở lại, còn biên bản điều tra
   *vì sao* thì sang [docs/DEAD-ENDS.md](docs/DEAD-ENDS.md).

---

## Test

Xem [docs/TESTING.md](docs/TESTING.md) — 4 tầng, phép thử phá hoại, bảng chẩn đoán
triệu chứng thường gặp.

```bash
bash .claude/scripts/smoke-scripts.sh     # tầng 0, không cần MCP, ~30 giây
python3 scripts/lint-harness.py           # frontmatter, link, JSON, cú pháp script
bash scripts/check-gitignore.sh           # gitignore.snippet thật sự ignore
```

CI (`.github/workflows/ci.yml`) chạy cả ba trên mỗi push, cộng typecheck project Playwright.

Tầng 2 là 5 kịch bản trong `evals/`, chạy tay trong Claude Code. **Chạy baseline trước**
(cùng câu hỏi trong thư mục không có `.claude/`) — không có baseline thì mọi cải thiện
chỉ là cảm giác.

---

## Trạng thái

Kế thừa từ bản gốc, đã verify ở tầng script: `build.py` (validate, style, Traceability,
overflow section), `write_defects.py` (fill/read/writeback, `Won't fix`, `[MANUAL]`, lệch
số dòng), template 8 sheet với 12 slot RESULT BY SECTION.

Chưa chạy trên Scientec: toàn bộ luồng end-to-end (chưa có URL thật, form đăng nhập
trong `scientec-e2e/` còn là giữ chỗ), `postman-api-test` (chưa có collection — nhánh
API đang skip theo thiết kế), và `playwright-export` trên app Scientec.

Chưa có kết quả baseline nào của tầng 2 được ghi lại.
