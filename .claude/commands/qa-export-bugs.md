---
description: Đọc sheet Defects đã review, soạn bug report nháp -> bạn duyệt cả lô -> ghi bugs_<ID>.md và Bug ID vào Excel
argument-hint: <ID>
---

Xuất bug report cho tính năng **$1** (feature ID).

Chặng này chạy **hai nửa, có một điểm dừng duyệt ở giữa**:

```
bug-writer          ->  BẠN DUYỆT CẢ LÔ  ->  command ghi file
(đọc, soạn, chống trùng,                     (bugs_$1.md + writeback
 ghi bugs-draft_$1.md)                        Bug ID vào Excel + recalc)
```

Điểm duyệt nằm ở command chứ không nằm trong agent, vì **subagent không dừng chờ người
được** — agent tự ghi file chính thức là tự duyệt cho mình (mất hàng rào "con người
bấm nút cuối").

Không có bug tracker: bug chỉ nằm ở sheet Defects và `.qa/$1/bugs_$1.md`. Không tạo
gì ở công cụ ngoài, không upload đâu cả.

## Cổng đầu vào — làm TRƯỚC khi gọi agent

Ba mức: **Chặn** = không có mặc định an toàn, phải hỏi · **Xác nhận** = có mặc định
nhưng mặc định vẫn là phán đoán, nêu ra chờ tôi gật · **Tự quyết** = chuyên môn của
bạn, làm luôn nhưng liệt kê trong tổng kết. Gộp mọi câu hỏi vào MỘT lượt, mỗi câu nêu
rõ mặc định đề xuất. Không bao giờ hỏi mật khẩu/token qua chat.

Gộp thành một lượt hỏi:

1. **File nào** — liệt kê `.xlsx` trong `.qa/$1/`. Không có → dừng, bảo tôi chạy
   `/qa-run $1` trước. Nhiều hơn một → hỏi tôi chọn; đúng một → nêu tên để tôi xác
   nhận. **Đừng tự lấy file mới nhất.**
2. **Xác nhận — tôi đã review xong sheet Defects và đã lưu file chưa** (mặc định: đã).
   Excel đang mở chưa lưu thì script đọc bản cũ — mọi dòng tôi đánh `Won't fix` vẫn
   thành bug. Nhắc: muốn bỏ một case thì đặt **Fix Status = "Won't fix"**, **đừng xoá
   dòng** (xoá dòng không giữ được ý định — lần `fill` sau nó quay lại).
3. **Xác nhận — staging URL cho mục Environment** — lấy `BASE_URL` từ
   `bash .claude/scripts/qa-config.sh project`.

`.qa/$1/bugs_$1.md` đã tồn tại → nêu số bug đang có; lần này sẽ **merge** (đánh ID
tiếp, không ghi đè).

Trước khi gọi agent, nói với tôi một dòng: muốn theo dõi tiến trình thì mở terminal
thứ hai và chạy `tail -f .qa/$1/progress.log`.

## Nửa 1 — gọi `bug-writer`

```
FEATURE_ID: $1
TESTCASE_FILE: (file .xlsx tôi đã chọn)
BASE_URL: (staging URL đã xác nhận)
```

Agent đọc Defects (`write_defects.py --mode read`), soạn bug với ID `BUG-$1-NNN`,
chống trùng với `bugs_$1.md` đã có, ghi `.qa/$1/bugs-draft_$1.md`, rồi **kết thúc**.
Nó không ghi file chính thức, không writeback.

## ĐIỂM DỪNG — trình bảng, xin duyệt MỘT lần cho cả lô

Đọc `.qa/$1/bugs-draft_$1.md` rồi trình cho tôi một bảng gọn:

| Draft ID | TC ID | Title | Priority | Trùng? |
|---|---|---|---|---|

Nêu kèm: số dòng bị loại và lý do (`Won't fix` hoặc bất kỳ Fix Status nào khác, đã có
Bug ID, `[MANUAL]`), và **mọi bug nghi trùng** với bug đã có trong `bugs_$1.md` — với
mỗi cái hỏi rõ tôi muốn **dùng ID cũ** hay **vẫn tạo mới**.

Xin duyệt **một lần cho cả lô**, không hỏi từng cái. Tôi có thể bỏ bớt bug, sửa
title/priority/nội dung trong cùng lượt trả lời (hoặc sửa thẳng file nháp rồi gõ ok).

**Không ghi `bugs_$1.md` và không writeback khi tôi chưa đồng ý rõ ràng.**

### Danh sách rỗng → không có gì để duyệt

Nói với tôi là tính năng sạch, ghi trạng thái `done` rồi kết thúc. Không tạo
`bugs_$1.md` rỗng.

## Nửa 2 — command tự ghi (sau khi tôi duyệt)

Chỉ làm với **đúng danh sách đã duyệt** — không thêm bug nào ngoài danh sách, kể cả
khi đọc file thấy dòng hợp lệ khác. Tôi đã nhìn bảng và chọn; thêm vào là qua mặt tôi.

1. **Ghi/merge `.qa/$1/bugs_$1.md`** theo khuôn `skill: bug-report-format`:
   - Chưa có file → tạo mới với header + bảng tóm tắt + các khối bug.
   - Đã có → **append** khối bug mới vào cuối và thêm dòng vào bảng tóm tắt. Không
     sửa, không xoá, không đánh số lại bug cũ.
   - Bug tôi chọn **dùng ID cũ** → không thêm khối mới; chỉ đưa ID cũ vào bugmap.
   - Bug tôi bỏ khi duyệt → không ghi, không writeback. Nêu ra để tôi đặt
     `Won't fix` trong Excel nếu muốn nó không quay lại lần sau.
2. **Writeback Bug ID vào Excel, rồi recalc:**

   ```bash
   bash .claude/scripts/qa-py.sh .claude/skills/testcase-template/scripts/write_defects.py \
     --file .qa/$1/<file.xlsx> --mode writeback \
     --bugmap '{"TC-A-003": "BUG-$1-001", "TC-B-002": "BUG-$1-002"}'
   bash .claude/scripts/qa-py.sh .claude/skills/testcase-template/scripts/recalc.py .qa/$1/<file.xlsx>
   ```

   **Khoá theo TC ID, không theo số dòng** — tôi có thể đã chèn/xoá dòng, số dòng
   lệch ngay còn TC ID thì không. Script ghi vào cột Bug ID (Defects) **và** cạnh
   Result của round fail (Test Cases). `recalc.py` chạy **sau** writeback: openpyxl
   xoá cache công thức mỗi lần save, nên recalc trước là tính xong rồi bị xoá.

   Đọc phần `failed` trong output: TC ID nào không tìm thấy dòng defect là dấu hiệu
   file đã bị sửa ngoài dự kiến — báo, đừng lặng lẽ bỏ qua. Lỗi giữa chừng → chạy
   lại an toàn: writeback khoá theo TC ID, `read` bỏ qua dòng đã có Bug ID.
3. Xoá `.qa/$1/bugs-draft_$1.md` sau khi cả hai bước trên thành công (giữ lại nếu có
   bước hỏng, để chạy lại không phải soạn lại).

## Sau khi xong, báo bằng tiếng Việt

1. Bug đã ghi (TC ID → Bug ID)
2. Bug dùng lại ID cũ, và bug bỏ qua kèm lý do (Won't fix / đã có Bug ID / `[MANUAL]` /
   tôi loại khi duyệt)
3. Writeback hỏng và lý do — nêu rõ chạy lại được
4. Đường dẫn `.qa/$1/bugs_$1.md` và file `.xlsx`
5. Khối tổng kết đầu vào: tôi đã xác nhận gì, còn treo gì
6. Bước tiếp theo: gửi `bugs_$1.md` cho dev; sau khi fix và deploy production thì
   chạy `/qa-verify-prod $1`

## Ghi trạng thái (bắt buộc — để `/qa-status` và resume dùng được)

**Ngay trước khi gọi agent:**
```bash
bash .claude/scripts/qa-state.sh set $1 export-bugs in_progress "soạn bug report"
```

**Khi kết thúc chặng** (sau nửa 2, hoặc khi dừng/hỏng ở bất kỳ đâu) — command vẫn sống
sau agent, nên đây là chỗ duy nhất ghi được cả trường hợp thất bại:
```bash
bash .claude/scripts/qa-state.sh set $1 export-bugs done   "<tóm tắt 1 dòng: mấy bug đã ghi, writeback ok chưa>"
bash .claude/scripts/qa-state.sh set $1 export-bugs failed "<lý do dừng>"
```

Journal này là **nhật ký, không phải nguồn chân lý** — artifact trên đĩa mới là sự
thật. Đừng bỏ bước ghi: bỏ là `/qa-status` mù, và lần chạy sau không biết tiếp từ đâu.
