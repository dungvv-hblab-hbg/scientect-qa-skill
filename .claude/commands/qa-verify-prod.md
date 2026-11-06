---
description: Sau khi deploy lên production, chạy lại spec Playwright của tính năng (chỉ case @prod-safe) và xuất báo cáo verify
argument-hint: <ID>
---

Verify production cho tính năng **$1** (feature ID) sau khi đã deploy.

## Cổng đầu vào — làm TRƯỚC khi gọi agent

Ba mức: **Chặn** = không có mặc định an toàn, phải hỏi · **Xác nhận** = có mặc định
nhưng mặc định vẫn là phán đoán, nêu ra chờ tôi gật · **Tự quyết** = chuyên môn của
bạn, làm luôn nhưng liệt kê trong tổng kết. Gộp mọi câu hỏi vào MỘT lượt, mỗi câu nêu
rõ mặc định đề xuất. Không bao giờ hỏi mật khẩu/token qua chat.

**Chặn:**
1. **Tính năng đã deploy lên production thật chưa?** Production chạy ở
   `PROD_BASE_URL` (`bash .claude/scripts/qa-config.sh project`; cấu hình prod ở mục
   `production`). Harness không có quyền đọc code hay pipeline deploy, nên **không tự
   kiểm được** — hỏi tôi xác nhận rõ ràng: "Tính năng $1 (và các bug fix liên quan)
   đã deploy xong lên production chưa?". Không có câu trả lời "đã deploy" → **DỪNG**.
   Chạy verify trước khi deploy xong là đo bản cũ rồi báo xanh, sai nguy hiểm nhất
   của chặng này.
2. **Repo có dùng project e2e không** — `bash .claude/scripts/qa-config.sh playwright`.
   `Trạng thái` là `KHÔNG DÙNG` → **DỪNG**: không có spec để verify, phải verify tay.
   Đừng báo xanh.
3. **Spec tồn tại chưa** — `scientec-e2e/tests/$1.spec.ts`. Không có → dừng, bảo tôi chạy
   `/qa-run $1` trên staging trước.
4. **Có case nào gắn `@prod-safe` không** — đếm bằng
   `cd scientec-e2e && npx playwright test --project=prod tests/$1.spec.ts --list`.
   Bằng 0 → dừng, báo tôi cần gắn tag cho case chỉ-xem rồi quay lại. Đừng chạy suông
   rồi báo xanh.
5. **`.env` có `PROD_BASE_URL` + account prod chưa** — thiếu → dừng, hướng dẫn tôi
   điền. Đừng hỏi mật khẩu qua chat.

**Xác nhận:**

| Giá trị | Mặc định đề xuất |
|---|---|
| Ghi kết quả prod vào đâu | chỉ xuất báo cáo `.qa/$1/prod-verify-<ngày>.md`; muốn ghi thêm vào cột Round nào của file Excel thì tôi nói rõ |
| Có ghi bug ngay khi phát hiện regression | không — đề xuất rồi chờ tôi duyệt; duyệt thì ghi qua sheet Defects + `/qa-export-bugs $1` |

Trước khi chạy, cho tôi biết **sẽ chạy bao nhiêu / tổng bao nhiêu case** của tính năng và
case nào bị loại vì không gắn tag. Tôi cần biết độ phủ, đừng để tôi tưởng đã verify
toàn bộ.

Trước khi gọi agent, nói với tôi một dòng: muốn theo dõi tiến trình thì mở terminal
thứ hai và chạy `tail -f .qa/$1/progress.log`.

Gọi agent `prod-verifier` với:

```
FEATURE_ID: $1
SPEC: scientec-e2e/tests/$1.spec.ts
DEPLOYED: (tôi đã xác nhận đã lên production)
RECORD_TO: (báo cáo riêng / cột Round nào)
PRECHECKS_OK: (đã kiểm ở cổng 1-5: Trạng thái=CÓ · spec tồn tại · <n>/<tổng> case
               @prod-safe · .env đủ PROD_BASE_URL + account — hoặc "?" nếu chưa kiểm)
```

`PRECHECKS_OK` có giá trị thật → agent **dùng thẳng, bỏ qua bước 1**. Ghi `?` thì
agent tự kiểm như cũ (trường hợp có ai gọi agent trực tiếp, không qua command).

Sau khi agent kết thúc, báo bằng tiếng Việt:
1. Độ phủ: chạy bao nhiêu / tổng bao nhiêu case, case nào bị loại và vì sao
2. Kết quả từng case, đối chiếu với staging
3. **Regression** (staging Pass, prod Fail) — nêu thẳng, đây là sự cố production
4. Case chưa kết luận được (lệch dữ liệu / nhiễu môi trường) và cần tôi làm gì
5. Đường dẫn báo cáo `.qa/$1/prod-verify-<ngày>.md`
6. Khối tổng kết đầu vào

Đừng tự ghi bug. Đừng chạy case không gắn `@prod-safe`.

## Ghi trạng thái (bắt buộc — để `/qa-status` và resume dùng được)

**Ngay trước khi gọi agent:**
```bash
bash .claude/scripts/qa-state.sh set $1 verify-prod in_progress "verify production"
```

**Ngay sau khi agent kết thúc**, kể cả khi hỏng — command vẫn sống sau agent, nên
đây là chỗ duy nhất ghi được cả trường hợp thất bại:
```bash
bash .claude/scripts/qa-state.sh set $1 verify-prod done   "<tóm tắt 1 dòng: chạy n/tổng, mấy regression>"
bash .claude/scripts/qa-state.sh set $1 verify-prod failed "<lý do dừng>"
```

Journal này là **nhật ký, không phải nguồn chân lý** — artifact trên đĩa mới là sự
thật. Đừng bỏ bước ghi: bỏ là `/qa-status` mù, và lần chạy sau không biết tiếp từ đâu.
