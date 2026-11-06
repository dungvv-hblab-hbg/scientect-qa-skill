---
name: bug-report-format
description: >-
  Dùng khi cần soạn bug report (Markdown, tiếng Anh) cho test case Fail/Blocked từ
  sheet Defects, hoặc khi người dùng nói "viết bug cho case này", "xuất bug report".
  Khuôn của file .qa/<ID>/bugs_<ID>.md.
---

# bug-report-format

Khuôn để mọi bug report từ harness đồng nhất, đủ thông tin cho dev fix ngay, không
phải hỏi lại. Skill là phần TĨNH (bug trông thế nào); agent `bug-writer` soạn nháp,
command `/qa-export-bugs` ghi file chính thức sau khi người dùng duyệt.

Không có bug tracker: bug chỉ nằm ở sheet Defects (cột Bug ID) và file Markdown
`.qa/<ID>/bugs_<ID>.md`. Cấu hình (priority map, định dạng ID): `bash .claude/scripts/qa-config.sh bugs`.

Ví dụ hoàn chỉnh: [assets/example-bug.md](assets/example-bug.md).

## Nguồn dữ liệu bug

Bug được soạn từ **sheet "Defects & Follow-ups"** (sau khi người dùng review: sửa
Actual, đánh Fix Status). Dữ liệu lấy qua `write_defects.py --mode read`, đã kèm sẵn
steps/expected từ sheet Test Cases. KHÔNG tự bịa nội dung ngoài những gì có trong file
và spec `.qa/<ID>/spec.md`.

**Dòng cần soạn bug = chưa có Bug ID VÀ chưa có Fix Status.** Người dùng từ chối một
bug bằng cách đặt **Fix Status = "Won't fix"**, KHÔNG phải bằng cách xoá dòng — xoá
dòng thì lần retest sau case vẫn Fail, vẫn chưa có Bug ID, nên nó quay lại.

## Đầu vào skill cần

| Cần | Nguồn | Thiếu thì |
|---|---|---|
| Actual Result cụ thể | cột Actual của sheet Defects (agent điền từ log, người dùng đã review) | Hỏi. **Không viết "it's broken" hay mô tả chung chung** |
| Steps + Expected | sheet Test Cases, qua `--mode read` | Hỏi. Không tự viết lại các bước |
| Preconditions | cột Precondition, qua `--mode cases` | Ghi `None` nếu case không có |
| Spec reference (AC ID) | sheet Traceability / `.qa/<ID>/spec.md` | Ghi `Not mapped` — đừng bỏ trống lặng lẽ |
| Environment | staging `BASE_URL` (`qa-config.sh project`) + round | Hỏi |
| Duyệt cả lô | người dùng, ở command | Không ghi `bugs_<ID>.md` khi chưa được duyệt |

## Ngôn ngữ

Bug viết bằng **tiếng Anh** — cùng ngôn ngữ với sheet "Test Cases" (EN), là nguồn
chân lý mà Steps/Expected được lấy ra. Ngoại lệ: message hệ thống trích nguyên văn
giữ đúng ngôn ngữ gốc trong ngoặc kép.

## ID bug

`BUG-<ID>-NNN` — `<ID>` là feature ID, NNN 3 chữ số, đánh tiếp từ số lớn nhất đã có
trong `bugs_<ID>.md`. **Không tái dùng số**, kể cả bug đã bỏ: ID đã ghi vào Excel là
vĩnh viễn. VD `BUG-INV-001-003`.

## Chống trùng — với `bugs_<ID>.md`, không chỉ với sheet Defects

Sheet Defects chỉ chống trùng theo dòng của chính nó. Trước khi soạn, đọc
`bugs_<ID>.md` đã có:
- Cùng TC ID đã có bug → không soạn mới, dùng ID cũ.
- Khác TC ID, cùng triệu chứng → nêu ra để người dùng chọn: dùng ID cũ hay tạo mới.

## Cấu trúc file `bugs_<ID>.md`

```markdown
# Bug report — <ID>

Spec: .qa/<ID>/spec.md · Test case file: .qa/<ID>/<file>.xlsx · Environment: <BASE_URL>

| Bug ID | TC ID | Title | Severity | Priority |
|---|---|---|---|---|
| BUG-<ID>-001 | TC-A-003 | ... | Major | High |

---

## BUG-<ID>-001 — <title>
...
```

Merge lần sau: **append** khối bug mới + dòng mới vào bảng tóm tắt. Không sửa, không
xoá, không đánh số lại bug cũ.

## Một khối bug — các mục bắt buộc

```markdown
## BUG-<ID>-NNN — [<Screen/API>] <short symptom>

- **TC ID:** TC-X-NNN
- **Severity:** Critical | Major | Minor | Trivial
- **Priority:** High | Normal | Low
- **Environment:** <staging BASE_URL> · Round <n> · <browser / API client>
- **Spec reference:** <AC ID> (spec.md §...)

**Description**
<cái gì sai, ở màn hình/endpoint nào, ảnh hưởng ai>

**Preconditions**
<tài khoản/dữ liệu cần có>

**Steps to reproduce**
1. ...

**Expected result**
...

**Actual result**
...

**Evidence**
- .qa/<ID>/phase1/TC-X-NNN-FAIL.png
```

- **Description** — đọc hiểu được ngay: cái gì sai, ở đâu, ảnh hưởng ra sao. Không
  chép nguyên Title, không mở đầu bằng tên class.
- **Steps** — từ Test Steps (cột G sheet Test Cases), đánh số, đủ để người khác làm
  theo ra đúng lỗi.
- **Expected** — từ Expected Result (cột I). Message thì trích nguyên văn.
- **Actual** — cụ thể: message sai gì, status code nào, hành vi lệch ra sao.
- **Severity** — mức ảnh hưởng (QA đánh giá từ Actual). **Priority** — map từ
  Priority của test case: High/Medium/Low → High/Normal/Low (`qa-config.sh bugs`).
- **Evidence** — đường dẫn ảnh dưới `.qa/<ID>/` (Phase 1) hoặc
  `scientec-e2e/test-results/` (chạy bằng code). Không đính data nhạy cảm nguyên văn.
- **Không có** assignee, tag, list, status của công cụ ngoài nào.

## Tiêu đề bug

Ngắn, cụ thể, có ngữ cảnh: `[Screen/API] <short symptom>`.
VD: `[Invoice Detail] Missing error message when due date is left empty`.
Tránh tiêu đề mơ hồ kiểu "Bug on detail page".

## Sau khi người dùng duyệt — writeback Bug ID

```
bash .claude/scripts/qa-py.sh .claude/skills/testcase-template/scripts/write_defects.py --file <out.xlsx> --mode writeback \
  --bugmap '{"TC-A-003": "BUG-INV-001-001"}'
bash .claude/scripts/qa-py.sh .claude/skills/testcase-template/scripts/recalc.py <out.xlsx>
```

**Khoá theo TC ID, KHÔNG theo số dòng.** Giữa `--mode read` và `--mode writeback`,
chỉ cần người dùng chèn hoặc xoá một dòng trong Excel là mọi index dòng lệch đi và
Bug ID sẽ gắn sang case khác — sai lặng lẽ, không có gì báo.

Script ghi vào cột "Bug ID/Ticket" của sheet Defects **và** cạnh Result của round
fail ở sheet Test Cases. Nhờ đó nhìn file biết ngay case nào đã có bug, và lần
retest `--mode read`/`fill` tự bỏ qua dòng đã có Bug ID nên không tạo trùng.

## Ranh giới

- Skill chỉ định KHUÔN. `bug-writer` dùng khuôn để **soạn nháp**; command ghi
  `bugs_<ID>.md` và writeback chỉ sau khi người dùng đã duyệt cả lô.
- KHÔNG soạn bug cho dòng đã có Bug ID, đã có Fix Status, hoặc case `[MANUAL]`.
- KHÔNG đính data khách/nhạy cảm nguyên văn vào bug.

## Tự kiểm trước khi trình duyệt

- [ ] Đủ mục: TC ID · Severity · Priority · Environment · Spec reference ·
      Description · Preconditions · Steps · Expected · Actual · Evidence
- [ ] Tiêu đề cụ thể, có ngữ cảnh màn hình/API
- [ ] Actual cụ thể (message/status thật), không chung chung
- [ ] ID `BUG-<ID>-NNN` đánh tiếp, không trùng số cũ
- [ ] Đã chống trùng với `bugs_<ID>.md`
- [ ] Sau khi duyệt: writeback bằng bugmap khoá theo TC ID, rồi `recalc.py`
