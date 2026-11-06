---
name: checklist-format
description: >-
  Dùng khi cần trình bày kết quả phân tích spec Markdown của một tính năng Scientec
  thành test-analysis checklist cho người review duyệt — kể cả khi người dùng chỉ
  nói "phân tích spec này", "cần test những gì", "làm checklist test", hay đang ở
  bước chuẩn bị trước khi gen test case.
---

# Checklist-format

Skill này định nghĩa **hình dạng** của một test-analysis checklist. Nó không
đọc spec, không quyết định khi nào dừng — những việc đó
là của agent gọi skill này. Nhiệm vụ duy nhất của skill: đảm bảo checklist xuất
ra luôn đúng cấu trúc, đúng quy ước, để người review quét được một lượt và phản
hồi bằng số thứ tự.

Ví dụ (rút gọn): [assets/example-checklist.md](assets/example-checklist.md).

## Chia mục C theo màn hình

Mục C chia theo **màn hình / luồng người dùng**, không theo loại kiểm thử. Test case sẽ
kế thừa cách chia này thành section, và `test-runner` chạy theo thứ tự đó — case cùng
màn hình chạy liền nhau thì không phải tải lại trang giữa chừng, thứ mất 10–30 giây mỗi
lần trên SPA này.

## Đầu vào skill cần

Cần: feature ID · file spec Markdown (`.qa/<ID>/spec.md`) · design nếu tính năng có UI
và spec có link Figma. Thiếu thứ nào thì hỏi, không bịa. Spec là nguồn duy nhất — harness
không đọc code, không xem git.

Thông tin không đọc được thì dùng nhãn `[Cần hỏi]` — đó là cách checklist ghi nhận
chỗ chưa biết. **Không được thay `[Cần hỏi]` bằng một giá trị tự nghĩ ra rồi gắn
nhãn `[Suy luận]`**: suy luận là rút ra từ dữ kiện có thật, không phải điền chỗ trống.

## Ngôn ngữ

Toàn bộ checklist viết bằng **tiếng Việt**. Ngoại lệ duy nhất: nội dung message
hệ thống trích nguyên văn (mục D2) giữ đúng ngôn ngữ gốc trong ngoặc kép.

## Viết cho ai đọc

Người đọc checklist là **tester và BA**, không phải dev. Nhiều người trong số đó không
đọc code. Viết như hướng dẫn cho một tester mới vào làm.

- **Câu ngắn, một ý một dòng.** Dài quá thì tách, đừng nhồi mệnh đề.
- **Chủ ngữ là người dùng hoặc hệ thống**, không phải hàm/service/bảng.
  "Hệ thống chặn lưu và báo lỗi" — không phải "validator trả về false".
- **Gọi đúng tên nhìn thấy trên màn hình**: tên menu, tên nút, nhãn ô nhập. Nhãn UI
  đang là tiếng Anh thì giữ nguyên trong nháy (`ô "Invoice No."`, `nút "Save"`), phần
  diễn giải viết tiếng Việt.
- **Không dùng thuật ngữ code**: `H1`, `div`, `endpoint`, `mapper`, `DTO`, tên bảng
  DB, tên hàm. Không viết tắt nội bộ mà không giải thích.
- **Đường dẫn URL không thay được tên màn hình.** "Mở menu Invoices" chứ không phải
  "mở `/invoices`".

Ngoại lệ hợp lệ: mã HTTP và tên endpoint ở phần API — người chạy phần đó cần đúng
những thứ này. Nhưng phần UI thì không được dính.

## Quy ước chung (áp dụng toàn tài liệu)

1. **Đánh số chạy liên tục** từ `#1` (bắt đầu ở mục C; mục A và B không đánh số)
   đến hết toàn tài liệu — KHÔNG đánh lại từ 1 ở mỗi mục. Người review phản hồi bằng số: "sai #4, #11, còn lại OK". Số thứ
   tự là khớp nối để tham chiếu về sau (đặc biệt giữa mục F và file test case
   Excel), nên một khi đã gán số thì **giữ nguyên** qua các lần chỉnh sửa.
2. **Mỗi dòng có nhãn nguồn** đặt đầu dòng, cho biết thông tin đến từ đâu:
   - `[AC-xx]` — lấy từ acceptance criteria của spec (ghi rõ mã hoặc vị trí)
   - `[Spec]` — từ phần khác của file spec (mô tả, ghi chú, bảng) — nêu mục/heading
   - `[Figma]` — đọc từ design
   - `[Chat]` — người dùng nói trong hội thoại, **chưa có trong file spec**
   - `[Suy luận]` — AI tự suy ra, chưa có căn cứ trực tiếp
   - `[Cần hỏi]` — chưa có căn cứ, cần BA/khách xác nhận

   Nhãn nguồn là phần quan trọng nhất của checklist: nó ép phân biệt rõ *cái
   biết chắc* với *cái đang đoán*, để người review biết chỗ nào cần soi kỹ.

   `[Chat]` khác `[AC-xx]` ở chỗ **không mở lại được**. Ba tháng sau, `[AC-03]` còn
   đối chiếu được với `.qa/<ID>/spec.md`; `[Chat]` thì nội dung gốc đã trôi mất trong
   lịch sử hội thoại của một người. Dùng nhãn này khi buộc phải, và đề nghị bổ sung
   nội dung đó vào file spec.
3. **Xuất ra FILE markdown** (không phải in trong chat). Người review cần một
   artifact lưu được, sửa/comment thẳng vào, và giữ lại làm đầu vào cho bước gen
   test case. Đường dẫn cố định: `.qa/<ID>/checklist_<ID>.md` — để dưới
   `.qa/` cho gọn repo và dễ gitignore, không rải ở gốc repo.
4. **Thêm mục mới thì APPEND số ở cuối tài liệu**, tuyệt đối không chèn số vào
   giữa và không đánh lại số. Số thứ tự là khoá tham chiếu ra cột Note của file
   Excel (`Xem giả định #12`); chèn giữa là mọi tham chiếu cũ trỏ sai. Mục bị bỏ
   thì đánh dấu `~~#11 (đã bỏ)~~`, giữ số, không tái sử dụng.
5. **Mã AC phải ổn định.** Spec chưa đánh mã thì tự gán `AC-01`, `AC-02`… theo
   thứ tự xuất hiện và **giữ nguyên qua mọi lần sửa** — mã này đi thẳng vào sheet
   Traceability của file test case.

## Cấu trúc checklist — theo đúng thứ tự A → G

### A. Nguồn đã đọc  *(không đánh số)*

Liệt kê chính xác đã đọc được **những gì**, TRƯỚC khi nói bất cứ điều gì về nội
dung. Mục này tồn tại để bắt lỗi đọc nhầm/thiếu nguồn — thứ mà mọi mục sau không
bắt được.

- File spec: đường dẫn gốc (VD `specs/INV-001.md`) và bản chụp `.qa/<ID>/spec.md`,
  số AC đọc được, AC có sẵn mã hay tự gán.
  Có dòng nào lấy từ hội thoại (`[Chat]`) → ghi thẳng ra ở đây, kèm câu "chưa có trong
  file spec — nên bổ sung để truy vết được". Đừng để mục A trông như mọi thứ đều đến
  từ nguồn chính thức
- Figma: liệt kê tên **từng frame** đã xem
- Tài liệu khác: API doc, spec cũ, file đính kèm
- Ghi rõ những gì **không** truy cập được và ảnh hưởng của nó

### B. Overview  *(không đánh số)*

3–5 dòng: tính năng làm gì, cho ai, kết quả cuối cùng là gì.

### C. Detail từng phần

Mỗi màn hình hoặc khối chức năng là một mục nhỏ, mô tả **luồng và hành vi**.

Checklist này để **tester dùng**, nên nguyên tắc chi phối là **phủ đủ mọi hành
vi cần test — không được sót case**. Đừng gò số dòng cho đẹp: tính năng nhỏ thì C
ngắn, spec dày (nhiều chục AC) thì C dài là bình thường và đúng. Thà dài mà đủ
còn hơn gọn mà sót.

Giới hạn duy nhất về nội dung: **KHÔNG nhét bảng field hay danh sách message vào
C** — chúng nằm ở phần D để quét được một lượt. C nói *"khối này làm gì, hành xử
ra sao"*; D liệt kê *"field/message cụ thể là gì"*. Nếu thấy mình đang liệt kê
field hay trích message trong C, đó là dấu hiệu nội dung đó thuộc về D.

### D. Các bảng tổng hợp (gom toàn tính năng)

Các bảng này gom dữ liệu của TẤT CẢ các phần ở C vào một chỗ để quét nhanh.

**D1. Bảng field**
`# · Thuộc phần · Tên field · Kiểu · Bắt buộc · Ràng buộc · Nguồn`

**D2. Danh sách message**
`# · Thuộc phần · Tình huống · Nội dung message (trích nguyên văn, trong ngoặc kép) · Nguồn`
Mọi câu thông báo sẽ dùng trong Expected Result về sau đều PHẢI có ở đây.

**D3. Business rule**
`# · Thuộc phần · Diễn giải rule bằng lời của AI · Nguồn`
Diễn giải lại chứ không chép nguyên văn — chép thì không chứng minh được là hiểu.

**D4. Out of scope**
`# · Hạng mục · Lý do hiểu là ngoài phạm vi · Nguồn`

**D5. Mâu thuẫn trong spec**
`# · Nội dung mâu thuẫn · Chỗ A nói gì (ở đâu) · Chỗ B nói gì (ở đâu) · Đang tạm theo bên nào`
BẮT BUỘC ghi rõ vị trí đọc được của cả hai bên, không chỉ nói "spec mâu thuẫn".

### E. Bảng có điều kiện  *(bắt buộc khi đủ điều kiện — không phải tùy chọn)*

**Role × quyền** — bắt buộc khi tính năng có từ **2 vai trò trở lên**.
`# · Vai trò · Xem được gì · Làm được gì · Nguồn`

**State & chuyển trạng thái** — bắt buộc khi bản ghi có **vòng đời**.
Liệt kê cả các chuyển đổi **bị cấm**.

### E2. Bảng AC  *(bắt buộc khi spec có acceptance criteria)*

`Mã AC · Nội dung AC (tóm tắt) · Thuộc phần nào ở C · Nguồn`

Mục này là **nguồn của sheet Traceability** trong file test case. Mã ở đây phải
khớp chính xác mã mà `testcase-writer` gắn vào từng test case; sai một chữ là
build.py báo AC `MISSING` dù thực ra đã phủ.

Spec không đánh mã AC → tự gán `AC-01`, `AC-02`… và ghi rõ vị trí gốc trong cột
Nguồn (VD `[AC-03] mục "Yêu cầu" gạch đầu dòng 3`).

### F. Giả định & câu hỏi cho BA/Dev

`# · Spec chưa nói gì · Giả định tạm dùng · Đề xuất của mình (kèm lý do ngắn) · Độ tự tin · Câu hỏi cụ thể cho khách`

Harness không đọc code, nên **căn cứ duy nhất để lên độ tin là thứ đọc được trong
spec, Figma, hoặc một quyết định đã được BA/khách trả lời** — không có schema DB hay
validator nào để dựa vào.

Mục này không chỉ nêu câu hỏi treo — với mỗi điểm mờ, **đưa luôn một đề xuất
phương án tốt nhất** kèm lý do, để người dùng có thể mang đi hỏi khách/BA, hoặc
tự tin thì dùng luôn khỏi cần confirm. Cột **Độ tự tin** cho người dùng biết cái
nào xài được ngay, cái nào bắt buộc phải hỏi:

- **Cao** — **chỉ khi đọc được căn cứ thật** và ghi rõ căn cứ đó: một chỗ khác trong
  spec, frame Figma, hoặc quy ước chung spec đã nêu (VD định dạng ngày theo mục
  "Quy ước chung" của spec, dẫn ra chỗ đọc được). Có thể **dùng luôn**; chỉ đổi nếu
  khách phản đối.
- **Vừa** — hợp lý nhưng có phương án thay thế; nên xác nhận nếu tiện, không thì
  dùng đề xuất và ghi rõ đã giả định.
- **Thấp** — không có căn cứ đọc được, hoặc thuộc nghiệp vụ riêng của khách.
  **Bắt buộc hỏi**, không tự quyết. Gồm:
  - **mọi ràng buộc SỐ của field mà spec không nói** — maxlength, min/max, số chữ
    số thập phân. Luôn `Thấp`, luôn phải hỏi — không có code để nâng lên `Cao`;
  - nghiệp vụ riêng (role nào được xoá bản ghi đã duyệt; ngưỡng cảnh báo theo
    hợp đồng).

**Ràng buộc số KHÔNG bao giờ là "Cao" chỉ vì có một con số nghe quen.** 255 không
phải "chuẩn DB" — nó là mặc định của một số ORM, và đoán nó ra một bộ test case
trông đầy đủ nhưng đo sai ràng buộc. Ba chỗ khác trong harness chặn đúng thứ này
(`common-validate`, `testcase-writer`, cổng `/qa-write-cases`); mục F không được
mở cửa sau cho nó.

Đề xuất phải trung thực với độ tự tin — không gán "Cao" cho thứ thực chất là phán
đoán nghiệp vụ. Mục này là mắt xích tham chiếu: cột Note trong file test case Excel
trỏ thẳng vào số ở đây ("Xem giả định #12"), nên số thứ tự phải giữ nguyên về sau.
Khi một câu hỏi được trả lời, nó không còn là giả định — cập nhật lại và test case
liên quan viết theo câu trả lời thật.

### G. Kế hoạch test  *(chỉ xuất khi dự kiến trên 15 case)*

Bảng ước lượng quy mô theo `Section × Type`. Bộ Type dùng cố định:
**UI · Validation · Boundary · Negative · Functional · Business rule · API**
(bộ Type này phải trùng khớp với skill `testcase-template` để bước gen test case
khớp nối được — không tự đổi tên loại).

**Mỗi ô ghi mức S / M / L, KHÔNG ghi con số cụ thể.** Con số (5, 8, 12...) trông
như đã thiết kế test case xong, dễ gây hiểu nhầm; trong khi đây mới chỉ là ước
lượng độ lớn để người review thấy quy mô. Quy ước:
- `–` : section không có loại test đó
- `S` : ít (khoảng 1–3 case)
- `M` : vừa (khoảng 4–8 case)
- `L` : nhiều (trên 8 case)

Đây chỉ để người review thấy độ lớn, KHÔNG phải bản thiết kế test case chi tiết.
Tính năng nhỏ (ước lượng ≤15 case) thì bỏ hẳn mục G (Kế hoạch test).

## Câu kết & section Phản hồi review

Cuối file checklist, thêm một section để người review viết phản hồi trực tiếp vào
file:

```markdown
---
## Phản hồi review
<!-- Viết phản hồi vào đây. VD:
  #N sai — maxlength thật là <số>, không phải 255
  #N bỏ, không thuộc scope tính năng
  #N — khách xác nhận có role view-only, Edit ẩn với họ
  Còn lại OK.
Lưu file lại rồi chạy /qa-apply-feedback <ID>. -->

(để trống cho người review)
```

**Ví dụ trong comment phải dùng số mục KHÔNG tồn tại trong checklist** (`#N`, `#999`)
hoặc câu chung. **KHÔNG dùng số mục thật kèm một câu trả lời nghe hợp lý** — người
review lướt qua rất dễ tưởng đó là quyết định đã chốt, và nó có thể **ngược** với quyết
định thật. Đã gặp: comment mẫu để lại một dòng dạng
`#71 — product confirmed: time-first order is correct` trong khi quyết định thật ghi ở
"Đã xử lý" là **ngược lại**.

`/qa-apply-feedback` dọn **nội dung** người review viết, không dọn comment mẫu — nên
comment mẫu sai sẽ sống qua mọi vòng review.

Cơ chế: người review ghi vào section này rồi lưu file → chạy
`/qa-apply-feedback <ID>` → Claude áp các chỉnh sửa vào đúng mục (theo số thứ
tự) → **chuyển nội dung phản hồi đã xử lý xuống section `## Đã xử lý (YYYY-MM-DD)`**.

**Chuyển, không xoá.** Đây là chữ của người dùng; parse sai một lần mà đã xoá thì
không lấy lại được, và cũng không truy được vì sao checklist đổi. Section "Đã xử
lý" nằm cuối file, người dùng tự dọn khi thấy đủ.

Giữ nguyên số thứ tự đã gán khi sửa; mục mới append số ở cuối.

Việc *đọc phản hồi, áp sửa, quyết khi nào checklist chốt* là hành vi luồng do
agent điều phối; skill chỉ quy định file phải có section này và định dạng của nó.

## Tự kiểm trước khi xuất

- [ ] Đọc lại như một tester mới vào: chỗ nào phải hỏi lại thì viết lại
- [ ] Phần UI không dính thuật ngữ code (`H1`, `endpoint`, tên class, tên bảng)
- [ ] Mục A đứng trước tiên, liệt kê nguồn đã/không đọc được
- [ ] Mọi dòng nội dung đều có nhãn nguồn
- [ ] Số thứ tự chạy liên tục toàn tài liệu, không reset theo mục
- [ ] C phủ đủ hành vi cần test, không sót case; field/message không lẫn vào C
- [ ] Mọi message dùng cho Expected Result đều có trong D2
- [ ] E xuất hiện nếu có ≥2 vai trò hoặc bản ghi có vòng đời
- [ ] E2 liệt kê đủ mọi AC, mã ổn định, mỗi AC trỏ về phần tương ứng ở C
- [ ] F: mỗi điểm mờ đều có đề xuất + độ tự tin; không gán "Cao" cho phán đoán nghiệp vụ
- [ ] F: ràng buộc số spec không nói luôn độ tin **Thấp**
- [ ] D5 ghi vị trí cả hai bên của mỗi mâu thuẫn
- [ ] **G** chỉ xuất khi ước lượng >15 case; mỗi ô ghi S/M/L (không con số); đúng bộ Type
- [ ] Số thứ tự mới được append ở cuối, không chèn giữa, không đánh lại
- [ ] Xuất ra file `.qa/<ID>/checklist_<ID>.md`
- [ ] Kết thúc bằng section Phản hồi review để người dùng chỉnh sửa
- [ ] Ví dụ trong comment mẫu dùng `#N` / `#999`, **không** dùng số mục thật của checklist
