---
description: Phân tích file spec Markdown của một tính năng Scientec -> file test-analysis checklist để bạn review
argument-hint: <spec.md> [ID]
---

Chạy chặng 1 của quy trình QA: đọc spec **$1** và dựng checklist cho tính năng **$2**
(rỗng thì lấy tên file spec).

```
spec .md → checklist → test case Excel → chạy test (UI/API) → bug report (Excel + MD) → verify production
           ▲ chặng này
```

## Cổng đầu vào — làm TRƯỚC khi gọi agent

Ba mức: **Chặn** = không có mặc định an toàn, phải hỏi · **Xác nhận** = có mặc định
nhưng mặc định vẫn là phán đoán, nêu ra chờ tôi gật · **Tự quyết** = chuyên môn của
bạn, làm luôn nhưng liệt kê trong tổng kết. Gộp mọi câu hỏi vào MỘT lượt, mỗi câu nêu
rõ mặc định đề xuất. Không bao giờ hỏi mật khẩu/token qua chat.

Chờ tôi trả lời xong mới gọi agent. Đừng đoán thay tôi.

1. **File spec** *(Chặn)* — `$1` rỗng thì hỏi đường dẫn. Có thì kiểm:
   - file tồn tại (`test -f "$1"`) — không có thì báo đúng đường dẫn đã thử, hỏi lại;
   - đuôi `.md` — khác thì dừng: harness chỉ nhận spec Markdown. Spec đang ở dạng
     khác (Word, PDF, Confluence) thì tôi tự chuyển sang `.md` rồi chạy lại.

   **Nếu tôi dán thẳng nội dung spec vào chat thay vì đưa đường dẫn** — **chưa phân
   tích gì cả.** Đề nghị lưu nó thành file trước:

   > "Spec này chưa nằm trong file nào. Tôi lưu nó thành `specs/<ID>.md` rồi phân tích
   > từ file đó nhé — checklist, test case và bug sau này đều trỏ ngược về spec, còn
   > nội dung dán trong chat thì ba tháng nữa không ai mở lại được."

   - Hỏi luôn ID muốn dùng (đề xuất một ID ngắn từ tên tính năng).
   - Cho tôi xem **nguyên văn** nội dung sẽ ghi vào `specs/<ID>.md`, **chờ tôi OK**
     rồi mới ghi. Không sửa câu chữ của spec — chỉ thêm tiêu đề `# <ID> — <tên tính năng>`
     nếu chưa có.
   - Ghi xong thì chạy tiếp chặng phân tích với file vừa tạo, không bắt tôi gõ lại lệnh.
   - Tôi không muốn lưu → dừng. **Không phân tích nội dung chat trần**: không có file
     thì không có bản gốc để đối chiếu lại.

2. **Feature ID** *(Xác nhận)* — mặc định = tên file spec bỏ đuôi `.md`
   (`specs/INV-001.md` → `INV-001`); `$2` có thì dùng `$2`. ID phải khớp
   `[A-Za-z0-9_-]+` — có dấu cách hay ký tự khác thì đề xuất bản đã thay bằng `-`.
   Nêu ID sẽ dùng, chờ tôi gật. ID là tên thư mục `.qa/<ID>/` và là khoá của mọi
   chặng sau, nên đổi về sau rất tốn.

   **Từ đây trở xuống, `<ID>` là ID đã được xác nhận** — không phải `$1` (đường dẫn
   spec). Gọi `qa-state.sh` với `$1` là ghi state vào một "tính năng" tên đường dẫn.

3. **`.qa/<ID>/` đã có checklist** *(Xác nhận)* — `checklist_<ID>.md` tồn tại thì hỏi:
   ghi đè (mất phản hồi review đã viết) hay dừng để chạy `/qa-apply-feedback <ID>`.
   Mặc định đề xuất: **dừng**.

**Không hỏi về Figma ở đây.** Chỉ agent mới đọc spec, nên hỏi "spec có link Figma
không" ở cổng này là hỏi mù. Agent tự xử: có link mà Figma MCP sẵn sàng thì đọc,
không thì ghi `[Cần hỏi]` ở mục A và nêu trong khối "còn treo". Tôi có sẵn link ở tay
thì tự đưa, không cần được hỏi.

## Chụp lại spec vào `.qa/<ID>/`

Sau khi tôi xác nhận, **chạy thẳng, không subagent**:

```bash
mkdir -p .qa/<ID> && cp "<đường dẫn spec>" .qa/<ID>/spec.md
```

Vì sao chụp: spec gốc trong `specs/` còn bị sửa tiếp. Mọi chặng sau (và `/qa-retro`)
đọc `.qa/<ID>/spec.md` — đúng phiên bản đã dùng để dựng checklist — chứ không đọc file
gốc đang trôi. Chạy lại `/qa-analyze` thì bản chụp được ghi đè bằng bản mới nhất; nói
với tôi một dòng nếu nội dung khác bản cũ.

Trước khi gọi agent, nói với tôi một dòng: muốn theo dõi tiến trình thì mở terminal
thứ hai và chạy `tail -f .qa/<ID>/progress.log`.

## Gọi agent `test-analyst`

Một agent, đọc spec và dựng checklist:

```
FEATURE_ID: <ID>
SPEC: .qa/<ID>/spec.md
FIGMA: (link tôi tự đưa, hoặc "không có" — agent vẫn tự tìm link trong spec)
```

Agent **chỉ đọc spec** (và Figma nếu có). Không có code, không có git, không có hệ
thống quản lý ticket nào trong chặng này — spec là nguồn duy nhất của "hệ thống phải
làm gì".

## Cổng giữa — spec không đủ dữ kiện để dựng checklist

`test-analyst` báo **`SPEC_INSUFFICIENT: có`** ở dòng đầu báo cáo → **DỪNG cả chặng.**
Không có checklist nào được ghi.

Báo lại cho tôi:
1. Ba con số agent đếm được (số AC · số từ mô tả · có Figma không)
2. **Danh sách chỗ thiếu** agent liệt kê — mỗi chỗ một dòng, viết thành câu hỏi cụ
   thể tôi mang đi hỏi BA/khách được
3. Lời mời: bổ sung vào file spec gốc rồi chạy lại `/qa-analyze <spec.md> <ID>`

**Không dựng checklist từ suy đoán, không đi dò UI để "đoán ngược" spec.** Spec
rỗng ruột mà vẫn ra checklist thì checklist trông như thật nhưng không có gì bảo
chứng — test sinh ra từ đó không bao giờ đỏ ở đúng chỗ cần đỏ. Việc bổ sung spec là
của người viết spec, không phải của harness.

## Báo lại sau khi agent xong

1. Đường dẫn checklist `.qa/<ID>/checklist_<ID>.md`
2. Số mục, số AC, số câu hỏi độ tin **Thấp** ở mục F, số dòng mâu thuẫn ở **D5**
3. D5 không rỗng thì nêu thẳng — đó là thứ người review cần nhìn trước tiên
4. Khối tổng kết đầu vào của agent
5. ▸ **DỪNG để review.** Mời tôi mở checklist, ghi phản hồi vào section "Phản hồi
   review" rồi chạy `/qa-apply-feedback <ID>`; ổn rồi thì chạy `/qa-write-cases <ID>`

## Ghi trạng thái (bắt buộc — để `/qa-status` và resume dùng được)

**Ngay trước khi gọi agent:**
```bash
bash .claude/scripts/qa-state.sh set <ID> analyze in_progress "bắt đầu phân tích"
```

**Ngay sau khi agent kết thúc**, kể cả khi hỏng — command vẫn sống sau agent, nên
đây là chỗ duy nhất ghi được cả trường hợp thất bại:
```bash
bash .claude/scripts/qa-state.sh set <ID> analyze done   "<tóm tắt 1 dòng: bao nhiêu AC, bao nhiêu câu Thấp>"
bash .claude/scripts/qa-state.sh set <ID> analyze failed "<lý do dừng — SPEC_INSUFFICIENT thì ghi rõ>"
```

Journal này là **nhật ký, không phải nguồn chân lý** — artifact trên đĩa mới là sự
thật. Đừng bỏ bước ghi: bỏ là `/qa-status` mù, và lần chạy sau không biết tiếp từ đâu.
