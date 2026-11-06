# Ví dụ checklist (rút gọn) — INV-001 · Invoice List & Invoice Detail

Bản rút gọn để thấy *hình dạng*: đánh số liên tục, nhãn nguồn ở mọi dòng, bảng D
gom toàn tính năng. Checklist thật dài hơn nhiều vì C phải phủ đủ hành vi.

---

## A. Nguồn đã đọc

- File spec: `specs/INV-001.md`, chụp lại ở `.qa/INV-001/spec.md`. Đọc mô tả + 6 AC
  (spec đã đánh mã sẵn) + mục "Quy ước chung".
- Figma: đã xem frame `Invoice List / Default`, `Invoice Detail / Default`.
  Frame `Invoice Detail / Mobile` có link trong spec nhưng không mở được.
- **Không đọc được:** frame Mobile → phần responsive ghi `[Cần hỏi]`.

## B. Overview

Màn hình danh sách hoá đơn và trang chi tiết hoá đơn, mở từ menu Invoices. Dành cho
Accountant và Viewer. Kết quả: người dùng tra được hoá đơn theo khách hàng và kỳ
doanh thu, xem chi tiết từng dòng và tổng tiền mà không phải xuất file.

## C. Detail từng phần

### C1. Danh sách hoá đơn
1. `[AC-01]` Mở menu Invoices thì hiện danh sách hoá đơn, mới nhất ở trên cùng.
2. `[AC-02]` Lọc theo khách hàng và khoảng ngày phát hành; bộ lọc giữ nguyên khi quay lại từ trang chi tiết.
3. `[Suy luận]` Bộ lọc không khớp hoá đơn nào → hiện trạng thái rỗng, không để trắng bảng.

### C2. Trang chi tiết hoá đơn
4. `[AC-03]` Bấm một dòng trong danh sách thì mở trang chi tiết của đúng hoá đơn đó.
5. `[AC-04]` Tổng tiền = tổng các dòng hàng + thuế, hiển thị 2 chữ số thập phân.
6. `[Figma]` Field thiếu dữ liệu hiển thị `—`, không để trống.
7. `[Cần hỏi]` Hành vi ở màn hình hẹp (chưa xem được frame Mobile).

### C3. Ghi chú hoá đơn
8. `[AC-05]` Accountant thêm được ghi chú cho hoá đơn ở trạng thái Draft.
9. `[Spec]` Hoá đơn đã Issued thì ô ghi chú chỉ đọc (mục "Quy ước chung").

## D. Các bảng tổng hợp

**D1. Bảng field**

| # | Thuộc phần | Tên field | Kiểu | Bắt buộc | Ràng buộc | Nguồn |
|---|---|---|---|---|---|---|
| 10 | C1 | Issue Date (from/to) | date | không | from ≤ to | `[AC-02]` |
| 11 | C3 | Note | text | có | spec không nói | `[AC-05]` |

**D2. Danh sách message**

| # | Thuộc phần | Tình huống | Nội dung message | Nguồn |
|---|---|---|---|---|
| 12 | C3 | Bỏ trống ghi chú khi lưu | "Note is required." | `[Figma]` |
| 13 | C1 | Không có hoá đơn khớp bộ lọc | "No invoices found." | `[AC-02]` |

**D3. Business rule**

| # | Thuộc phần | Diễn giải | Nguồn |
|---|---|---|---|
| 14 | C2 | Thuế tính trên tổng dòng hàng, làm tròn ở bước cuối, không làm tròn từng dòng | `[AC-04]` |

**D4. Out of scope**

| # | Hạng mục | Lý do | Nguồn |
|---|---|---|---|
| 15 | Tạo / sửa hoá đơn | Spec chỉ làm phần xem và ghi chú | `[Spec]` mục "Ngoài phạm vi" |

**D5. Mâu thuẫn trong spec**

| # | Nội dung | Chỗ A | Chỗ B | Tạm theo |
|---|---|---|---|---|
| 16 | Định dạng ngày | AC-02 ghi `DD/MM/YYYY` | Figma frame `Invoice List / Default` hiện `YYYY-MM-DD` | `DD/MM/YYYY` (theo AC) |

## E. Bảng có điều kiện

**Role × quyền** (có 2 vai trò)

| # | Vai trò | Xem được gì | Làm được gì | Nguồn |
|---|---|---|---|---|
| 17 | Accountant | toàn bộ | xem, thêm ghi chú | `[AC-06]` |
| 18 | Viewer | toàn bộ | chỉ xem | `[AC-06]` |

## E2. Bảng AC

| Mã AC | Nội dung | Thuộc phần | Nguồn |
|---|---|---|---|
| AC-01 | Danh sách hoá đơn, mới nhất trên cùng | C1 | `specs/INV-001.md` mục "Acceptance criteria" |
| AC-02 | Lọc theo khách hàng và ngày phát hành | C1 | như trên |
| AC-03 | Mở chi tiết hoá đơn từ danh sách | C2 | như trên |
| AC-04 | Tổng tiền = dòng hàng + thuế, 2 chữ số thập phân | C2 | như trên |
| AC-05 | Thêm ghi chú cho hoá đơn Draft | C3 | như trên |
| AC-06 | Viewer chỉ xem | E | như trên |

## F. Giả định & câu hỏi cho BA/Dev

| # | Spec chưa nói | Giả định tạm dùng | Đề xuất (lý do) | Độ tự tin | Câu hỏi cho khách |
|---|---|---|---|---|---|
| 19 | Định dạng ngày khi D5 #16 lệch | `DD/MM/YYYY` | AC là nguồn chính, Figma có thể chưa cập nhật | Vừa | Định dạng ngày đúng là gì? |
| 20 | maxlength ô Note | (chưa có) | Spec và Figma đều không nói; không đoán số | Thấp | Ghi chú tối đa bao nhiêu ký tự? |
| 21 | Viewer có thấy ghi chú nội bộ? | có | Không thấy dấu hiệu nhạy cảm trong spec | Vừa | Viewer có được xem ghi chú không? |

## G. Kế hoạch test

*(tính năng này ước lượng ≤15 case nên bỏ mục G)*

---
## Phản hồi review
<!-- Viết phản hồi vào đây. VD:
  #N sai — maxlength thật là <số>, không phải 255
  #N bỏ, không thuộc scope tính năng
  Còn lại OK.
Lưu file lại rồi chạy /qa-apply-feedback <ID>. -->

(để trống cho người review)
