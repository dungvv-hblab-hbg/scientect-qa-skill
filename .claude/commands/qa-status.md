---
description: Đang ở đâu trong quy trình QA — tính năng nào dở dang, chặng nào tiếp theo. Đọc-only
argument-hint: (không tham số = mọi feature ID · <ID> = một tính năng)
---

Cho tôi biết **đang ở đâu** và **nên chạy gì tiếp**. Đọc-only, không sửa gì.

## Lấy dữ liệu

```bash
bash .claude/scripts/qa-state.sh list          # không có $1
bash .claude/scripts/qa-state.sh get $1        # có $1
```

Trả về hai thứ tách biệt — **đọc cả hai, đừng chỉ nhìn một**:

- `state` — **nhật ký**: chặng nào đã chạy, lúc nào, ghi chú gì. Do command ghi sau
  mỗi chặng.
- `artifacts` — **sự thật trên đĩa**: file nào thật sự tồn tại lúc này.

## Quy tắc số một: artifact thắng nhật ký

`state.json` chỉ ghi lại *đã từng chạy gì*. Nó **không** chứng minh file còn đó —
người dùng xoá tay một `.xlsx` thì journal vẫn nói `done`.

Lệch nhau thì **báo thẳng, đừng làm phẳng**:

| Journal | Artifact | Nói gì |
|---|---|---|
| `analyze: done` | `checklist: false` | "Nhật ký nói đã phân tích nhưng **không thấy** `checklist_$1.md`. File bị xoá hay đổi tên? Chạy lại `/qa-analyze $1`." |
| `analyze: done` | `spec_snapshot: false` | "Không thấy bản chụp `.qa/$1/spec.md` — các chặng sau đọc spec từ đó. Chạy lại `/qa-analyze`." |
| `write-cases: done` | `testcase_xlsx: []` | "Không thấy file `.xlsx` nào. Chạy lại `/qa-write-cases $1`." |
| chưa có mục nào | có artifact | "Có file nhưng chưa có nhật ký — tính năng này chạy từ trước khi harness ghi trạng thái. Suy từ artifact." |

**Không có `state.json` KHÔNG có nghĩa là chưa làm gì.** Suy trạng thái từ artifact:
có `checklist_*.md` → analyze xong · có `*.xlsx` → write-cases xong · có
`prod-verify-*.md` → đã verify prod.

## `in_progress` quá lâu = đứt giữa chừng

`status: in_progress` mà `started_at` cách đây lâu (quá một buổi làm việc) thì **gần
như chắc chắn là đứt**, không phải đang chạy — session hết hạn, người dùng bấm dừng,
máy sập. Nói thẳng:

> `/qa-run INV-001` đang `in_progress` từ 09:14 (hơn 4 tiếng), ghi chú cuối:
> "case 30/45, Round 1". Nhiều khả năng đứt giữa chừng. Chạy lại `/qa-run INV-001`
> — cổng sẽ đề xuất `RESUME: có` và tiếp từ case 31, không chạy lại 30 case đầu.

## Trình bày

### Không có `$1` — toàn cảnh

Không feature ID nào → nói thẳng **"chưa chạy tính năng nào"**, rồi mời `/qa-analyze specs/<ID>.md`.
Đừng bịa ra một bảng rỗng.

Có feature ID → bảng, **mới nhất lên đầu** (dữ liệu đã sắp sẵn):

| Feature ID | Chặng cuối | Trạng thái | Cập nhật | Bước tiếp theo |
|---|---|---|---|---|

Nhiều hơn 5 feature ID thì chỉ hiện 5 cái gần nhất, nêu tổng số, và nói cách xem một cái
cụ thể (`/qa-status <ID>`).

**Chỉ rõ MỘT việc nên làm tiếp** — cái dở dang gần nhất. Đừng liệt kê sáu lựa chọn
ngang hàng rồi để tôi tự chọn.

### Có `$1` — chi tiết một tính năng

Bảng bảy chặng theo đúng thứ tự, mỗi chặng: trạng thái · thời điểm · ghi chú · artifact:

| # | Chặng | Trạng thái | Lúc | Artifact |
|---|---|---|---|---|
| 1 | analyze | done | 09:02 | `spec.md`, `checklist_$1.md` |
| 2 | apply-feedback | — | | |
| … | | | | |

Rồi **một dòng** kết luận: lệnh tiếp theo nên chạy, và vì sao.

## Bản đồ chặng → lệnh tiếp theo

| Trạng thái đọc được | Gợi ý |
|---|---|
| Chưa có gì | `/qa-analyze specs/$1.md` (hoặc đường dẫn spec thật + `$1`) |
| `analyze: done`, checklist có, chưa apply-feedback | Mở checklist review. Có sửa → ghi vào "Phản hồi review" rồi `/qa-apply-feedback $1`. Không sửa gì → `/qa-write-cases $1` |
| `apply-feedback: done` | `/qa-write-cases $1` |
| `write-cases: done`, có `.xlsx` | Review file test case, rồi `/qa-run $1` |
| `run: in_progress` | `/qa-run $1` — cổng sẽ đề xuất `RESUME: có` |
| `run: done` | Review sheet **Defects & Follow-ups** (bản LOCAL), rồi `/qa-export-bugs $1` |
| `export-bugs: in_progress`, có `bugs_draft`, chưa có `bugs_report` | Lô bug nháp `bugs-draft_$1.md` đang chờ duyệt. Duyệt (bỏ/sửa dòng) rồi `/qa-export-bugs $1` |
| `export-bugs: done` | Đã có `bugs_$1.md`. Xong chặng staging. Sau khi bản sửa lên production: `/qa-verify-prod $1` |
| `verify-prod: done` | Tính năng đã đi hết vòng |
| `retro: done` | Đã có `retro-<ngày>.md`. Mở đọc — mục **High** là thứ cần sửa trước |
| Bất kỳ chặng nào `failed` | Nêu ghi chú lỗi đã lưu, đề xuất chạy lại đúng chặng đó |

`retro` là chặng **tuỳ chọn**: không có nó KHÔNG phải thiếu sót, đừng giục. Chỉ nhắc
`/qa-retro $1` khi chặng `run` là `failed`, hoặc khi tôi hỏi vì sao lượt chạy kỳ lạ.

Thiếu điều kiện môi trường (không phải trạng thái tính năng) → trỏ sang **`/qa-doctor`**,
đừng đoán.

## Ranh giới

- **KHÔNG sửa gì** — không ghi `state.json`, không tạo file, không chạy chặng nào.
- KHÔNG suy diễn quá artifact: không thấy file thì nói không thấy, đừng đoán "chắc ở
  chỗ khác".
- Nhắc một lần khi có ích: `.qa/` đã gitignore nên trạng thái này **cục bộ theo máy**
  — máy khác hoặc người khác sẽ không thấy.
