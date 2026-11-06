# Cấu trúc `cases.json` — đầu vào của `build.py`

## Mục lục
- Khung tổng thể
- `cover` — metadata sheet Cover
- `acceptance_criteria` — nguồn sheet Traceability
- `assumptions` — nguồn sheet Assumptions & Questions
- `sections` / `cases` — nội dung test case
- Ràng buộc validate (nguyên nhân exit code 1)
- Ví dụ tối thiểu chạy được

---

## Khung tổng thể

```json
{
  "cover": { ... },
  "acceptance_criteria": [ ... ],
  "assumptions": [ ... ],
  "sections": [ { "divider": "...", "cases": [ ... ] } ]
}
```

## `cover` — metadata sheet Cover

| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `project` | không | Mặc định `"Scientec"` |
| `module` | **có** | Tên màn hình/tính năng, VD `"Invoice List & Detail"` |
| `version` | **có** | VD `"1.0"` |
| `source` | **có** | Feature ID + đường dẫn spec (+ link Figma), VD `"INV-001 · specs/INV-001.md · Figma: /file/xxx"`. Đừng bịa link |
| `create_date` | **có** | Định dạng `YYYY-MM-DD` |
| `change_desc` | không | Dòng đầu của RECORD OF CHANGE |

Thiếu một trong 4 field bắt buộc → `build.py` exit 1, không sinh file. Đây cũng
là lớp chặn placeholder `<MODULE>` / `<SOURCE>` sót lại trong output.

## `acceptance_criteria` — nguồn sheet Traceability

Lấy từ **mục E2 (Bảng AC)** của checklist đã review. Tuỳ chọn, nhưng có thì
`build.py` mới dựng được Traceability và mới bắt được AC hở.

```json
"acceptance_criteria": [
  { "id": "AC-01", "text": "Danh sách hoá đơn, mới nhất trên cùng" },
  { "id": "AC-02", "text": "Lọc theo khách hàng và ngày phát hành" }
]
```

Mã `id` phải khớp **chính xác** mã trong checklist và mã trong `acs` của từng
case. Sai một chữ là AC bị báo `MISSING` dù thực ra đã phủ.

## `assumptions` — nguồn sheet Assumptions & Questions

Lấy từ **mục F (Điểm mờ / câu hỏi)** của checklist đã review. Tuỳ chọn về mặt schema,
**bắt buộc trên thực tế**: mỗi câu hỏi mục F mà một test case dựa vào để viết Expected
Result thì phải có **một dòng** ở đây.

```json
"assumptions": [
  {
    "ref": "#19",
    "topic": "Issue Date format",
    "gap": "Spec AC and Figma show two formats, no decision recorded",
    "assumption": "DD/MM/YYYY",
    "question": "Which format is the pass criterion?",
    "answer": "DD/MM/YYYY — confirmed by reviewer",
    "date_closed": "2026-09-14"
  }
]
```

| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `ref` | **có** | Số mục trong checklist, giữ nguyên dấu `#`, VD `"#19"` |
| `topic` | **có** | Chủ đề ngắn |
| `gap` | không | Spec hở chỗ nào |
| `assumption` | **có** | Giả định đang dùng làm căn cứ cho Expected Result |
| `question` | không | Câu hỏi cho BA/Dev |
| `answer` | không | Câu trả lời khi đã chốt. Chưa chốt thì để trống |
| `date_closed` | không | `YYYY-MM-DD`. Sai định dạng → exit 1 |

**Marker trong Note: `[GĐ #NN]`.** Case nào lấy một giả định làm căn cứ cho Expected
Result thì cột Note ghi `[GĐ #NN]` — cùng họ với `[MANUAL]`, `[DATA-REQ]`.

`build.py` đối chiếu ngược: mọi `[GĐ #NN]` trong Note mà **không** có dòng `assumptions`
tương ứng sẽ vào `PROBLEMS` (exit 2). Case dựa vào một giả định mà giả định đó không
được ghi lại ở đâu là **lỗi** — sheet này là chỗ duy nhất người mở file sau này biết vì
sao Expected Result lại là chuỗi đó.

Dùng marker riêng chứ **không** quét `#NN` trần, vì Note hợp lệ vẫn trích nguồn khác
bằng cùng cú pháp (VD `"Message lấy từ D2 #17 của checklist"`) — quét trần là báo nhầm
mọi case như thế.

## `sections` / `cases`

```json
"sections": [
  {
    "divider": "A. Page & Entry",
    "cases": [
      {
        "id": "TC-A-001",
        "section": "Page & Entry",
        "type": "Functional",
        "priority": "High",
        "acs": ["AC-01"],
        "title_en": "...",     "title_vn": "...",
        "precond_en": "...",   "precond_vn": "...",
        "steps_en": "1. ...\n2. ...",     "steps_vn": "1. ...\n2. ...",
        "data_en": "...",      "data_vn": "...",
        "expected_en": "1. ...\n2. ...",  "expected_vn": "1. ...\n2. ...",
        "note_en": "",         "note_vn": ""
      }
    ]
  }
]
```

| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `divider` | có | Chữ cái đầu phải khớp phần giữa của ID: `A. ...` ↔ `TC-A-xxx` |
| `id` | có | Đúng pattern `TC-<CHỮ/SỐ>-<3 chữ số>`, duy nhất toàn file |
| `section` | có | Dùng cho COUNTIF ở Summary; nên khớp phần chữ của `divider` |
| `type` | có | Chỉ 7 giá trị: `UI` `Validation` `Boundary` `Negative` `Functional` `Business rule` `API` |
| `priority` | có | `High` / `Medium` / `Low` — do agent quyết theo rủi ro |
| `acs` | không | Danh sách mã AC case này phủ; `[]` là hợp lệ (case suy luận thêm) |
| `*_en` | có (title/steps/expected) | Sheet EN là nguồn chân lý |
| `*_vn` | có (title/steps/expected) | Bản dịch phái sinh; thiếu → exit 1 |
| `note_en` / `note_vn` | không | Cột N. Case chờ chạy tay phải bắt đầu bằng `[MANUAL]` |

Nhiều dòng trong `steps_*` / `expected_*` dùng `\n` trong cùng một chuỗi, đánh
số `1. 2. 3.`. Nhiều giá trị trong `data_*` phân tách bằng ` · `.

## Ràng buộc validate (nguyên nhân exit code 1)

`build.py` chặn trước khi sinh file khi:

- thiếu field bắt buộc trong `cover`;
- `id` trùng nhau (lỗi im lặng nguy hiểm nhất — `write_defects.py` dựng dict theo
  TC ID, bản sau nuốt bản trước);
- `id` sai pattern, hoặc chữ cái trong ID không khớp `divider`;
- `type` hoặc `priority` không thuộc danh sách dropdown;
- thiếu bản dịch VN của title/steps/expected;
- `acs` trỏ tới mã AC không có trong `acceptance_criteria`.

Exit code 2 (file **có** sinh ra nhưng phải xử lý): còn AC chưa được case nào phủ,
hoặc số section vượt số slot của bảng RESULT BY SECTION.

## Ví dụ tối thiểu chạy được

```json
{
  "cover": {
    "module": "Invoice List & Detail",
    "version": "1.0",
    "source": "INV-001 · specs/INV-001.md",
    "create_date": "2026-08-30"
  },
  "acceptance_criteria": [
    { "id": "AC-03", "text": "Mở chi tiết hoá đơn từ danh sách" }
  ],
  "sections": [
    {
      "divider": "A. Page & Entry",
      "cases": [
        {
          "id": "TC-A-001",
          "section": "Page & Entry",
          "type": "Functional",
          "priority": "High",
          "acs": ["AC-03"],
          "title_en": "Open invoice detail from Invoices list",
          "title_vn": "Mở chi tiết hoá đơn từ danh sách Invoices",
          "precond_en": "Logged in, at least one invoice exists",
          "precond_vn": "Đã đăng nhập, có ít nhất một hoá đơn",
          "steps_en": "1. Open the Invoices menu\n2. Click the first invoice row",
          "steps_vn": "1. Mở menu Invoices\n2. Bấm dòng hoá đơn đầu tiên",
          "data_en": "Invoice: INV-2026-0001",
          "data_vn": "Hoá đơn: INV-2026-0001",
          "expected_en": "1. Detail page opens\n2. Heading shows the invoice number",
          "expected_vn": "1. Trang chi tiết mở ra\n2. Tiêu đề hiển thị số hoá đơn",
          "note_en": "",
          "note_vn": ""
        }
      ]
    }
  ]
}
```
