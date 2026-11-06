# Changelog — Scientec QA Harness

## v1.0 — 2026-11-06

Tách từ Telemax QA Harness (v3.8) thành harness riêng cho dự án **Scientec**.

### Thay đổi so với bản gốc

- **Đầu vào là spec Markdown có sẵn.** `/qa-analyze <spec.md> [ID]` đi thẳng từ spec ra
  checklist. Bỏ toàn bộ bước đọc code: `spec-analyst` ∥ `code-analyst` gộp thành một
  `test-analyst`; bỏ `ui-explorer`, nhánh không-có-spec, skill `git-diff-scope`.
- **Checklist:** bỏ mục D6 (spec ≠ code) và G (impact từ git diff); mục H cũ (kế hoạch
  test) đổi thành G.
- **Mã định danh:** feature ID tự do (mặc định = tên file spec), thay cho ticket `TLM-`.
- **Bug chỉ xuất file:** `/qa-file-bugs` → `/qa-export-bugs`, `bug-proposer` + `bug-filer`
  → `bug-writer`. Ghi sheet Defects + `.qa/<ID>/bugs_<ID>.md`, không tạo bug ở tracker
  nào, không upload Drive. Skill `clickup-bug-format` → `bug-report-format`.
- **Không còn kiểm nhánh git** ở `/qa-run` và `/qa-verify-prod`; thay bằng bước người
  dùng xác nhận bản build đã lên môi trường.
- Project e2e `telemax-e2e/` → `scientec-e2e/`, biến môi trường `SCIENTEC_*`.
- URL staging/production đang là **giá trị tạm** (`*.example.com`) — chờ URL thật.
- Bỏ mọi tham chiếu Telemax / ClickUp / telematics.

Lịch sử của bản gốc: xem repo `dungvv-hblab-hbg/telemax-qa-skill`.
