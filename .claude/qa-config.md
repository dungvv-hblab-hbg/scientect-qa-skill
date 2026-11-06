# qa-config — điểm khai báo duy nhất của harness

Mọi giá trị phụ thuộc team/repo nằm ở đây, không rải trong skill. Skill và agent
đọc file này thay vì hard-code đường dẫn hay ID.

**Điền một lần khi cài đặt.** Giá trị còn `CHƯA ĐIỀN` là điều kiện chưa thoả: agent
phải DỪNG và hỏi người dùng, không được đoán.

## Cách đọc file này — ĐỌC THEO MỤC, đừng `cat` cả file

```bash
bash .claude/scripts/qa-config.sh <mục>
```

| Mục | Ai cần | Dòng |
|---|---|---|
| `project` | `/qa-analyze`, `/qa-run`, `/qa-verify-prod` | 23 |
| `bugs` | `/qa-export-bugs`, `bug-writer`, `bug-report-format` | 13 |
| `playwright` | `/qa-run`, `/qa-setup`, `test-runner`, `playwright-export` | 38 |
| `production` | `/qa-verify-prod`, `prod-verifier` | 17 |
| `postman` | `/qa-run`, `test-runner`, `postman-api-test` | 23 |
| `all` | chỉ `/qa-setup` khi soát toàn bộ | 143 |

Mục Playwright dài nhất file và chẳng liên quan gì tới
`/qa-export-bugs`. Đọc cả file để lấy một bảng là trả tiền cho bốn bảng không dùng.

Vẫn giữ **một file** thay vì tách năm: tách ra là mở đường cho hai bản trôi lệch,
đúng thứ mà "điểm khai báo duy nhất" đang phòng.

## Dự án & môi trường

| Khoá | Giá trị |
|---|---|
| Dự án | **Scientec** |
| Feature ID | tự do, khớp `[A-Za-z0-9_-]+` (VD `INV-001`, `HBG_2201-45`). Mặc định = tên file spec bỏ `.md` (`specs/INV-001.md` → `INV-001`); người dùng có thể truyền ID khác ở tham số thứ 2 |
| Thư mục spec mặc định | `specs/` — mỗi tính năng một file `.md` |
| Thư mục output của harness | `.qa/<ID>/` — `/qa-analyze` chép spec vào `.qa/<ID>/spec.md` (bản chụp đúng phiên bản đã test) |

### Môi trường

| Môi trường | URL (khai báo trong `.env` của project e2e) | Dùng ở chặng |
|---|---|---|
| **staging** | `BASE_URL` — tạm `https://scientec-staging.example.com` *(TODO: thay URL thật của Scientec)* | `/qa-run` — test chính |
| **production** | `PROD_BASE_URL` — tạm `https://scientec.example.com` *(TODO: thay URL thật của Scientec)* | `/qa-verify-prod` — verify sau deploy |

Harness **không đọc code, không xem git** nên không tự biết bản build nào đang chạy.

**Hệ quả cho `/qa-run`:** tính năng phải **đã được deploy lên staging** thì test mới đo
đúng bản đó — người dùng xác nhận ở cổng input. Chưa deploy mà chạy test là đang đo bản
cũ rồi ghi kết quả cho tính năng mới — sai âm thầm, vì test vẫn chạy và vẫn ra số.
Tương tự, `/qa-verify-prod` hỏi người dùng xác nhận bản sửa đã lên production.

## Bug report (dùng bởi `bug-report-format`, `bug-writer`)

| Khoá | Giá trị |
|---|---|
| File output | `.qa/<ID>/bugs_<ID>.md` (bản đã duyệt) |
| File nháp | `.qa/<ID>/bugs-draft_<ID>.md` — lô bug chờ người dùng duyệt, chưa phải kết quả |
| Định dạng ID bug | `BUG-<ID>-NNN` (ID local, VD `BUG-INV-001-001`) — ghi ngược vào cột Bug ID của sheet Defects |
| Severity | `Critical` · `Major` · `Minor` · `Trivial` |
| Map priority | test case `High` → bug `High`; `Medium` → `Normal`; `Low` → `Low`. Sửa nếu team có thang riêng |
| Assignee | để trống — harness không đọc code nên không đề xuất người sửa |
| Ngôn ngữ bug | tiếng Anh (cùng ngôn ngữ sheet "Test Cases" EN) |
| Bug tracker ngoài | **không có** — bug chỉ nằm ở sheet Defects + file Markdown trên. Không tạo gì ở công cụ ngoài |

## Playwright (dùng bởi `playwright-export`, `test-runner`)

| Khoá | Giá trị |
|---|---|
| **Trạng thái** | **`CÓ`** · giá trị hợp lệ: `CÓ` · `CHƯA CÓ` · `KHÔNG DÙNG` (nghĩa của từng cái ở cuối mục). **Repo mới cài:** `install.sh` mặc định KHÔNG copy project e2e, nên nó tự đặt dòng này thành `CHƯA CÓ` khi cài — giá trị `CÓ` ở đây là của chính repo harness, nơi `scientec-e2e/` tồn tại thật |
| Thư mục project | `scientec-e2e/` ở gốc repo. **Mọi lệnh `npx playwright` phải chạy từ trong thư mục này** — agent đứng ở gốc repo nên luôn `cd scientec-e2e &&` trước |
| File spec | `scientec-e2e/tests/<ID>.spec.ts` |
| Config | `scientec-e2e/playwright.config.ts` |
| Login | `auth.setup.ts` + `storageState` — spec KHÔNG chứa bước đăng nhập |
| Trình duyệt lúc chạy | **Phase 1 qua MCP: HIỆN cửa sổ** (`@playwright/mcp` mặc định headed) — bạn nhìn thấy agent thao tác. Thêm `--headless` vào args trong `.mcp.json` nếu muốn chạy ngầm. **Chạy spec bằng `npx playwright test --project=chromium`: NGẦM** — thêm `--headed` nếu muốn nhìn |
| Gộp còn MỘT session | **ĐÃ THỬ — KHÔNG DÙNG ĐƯỢC, đừng thử lại.** Hai session tách biệt là thiết kế. Biên bản: [docs/DEAD-ENDS.md](../docs/DEAD-ENDS.md) §1 |
| Đã thử, đừng thử lại | Không bơm được storage state vào context MCP bằng JS — `browser_run_code_unsafe` không có filesystem. Chỉ seed được bằng tiến trình Node riêng. Biên bản: [docs/DEAD-ENDS.md](../docs/DEAD-ENDS.md) §2 |
| Timeout của MCP | `--timeout-action 30000` (mặc định chỉ **5s** — quá ngắn cho SPA này) · `--timeout-navigation 120000` (mặc định 60s; lần mở đầu tiên trong ngày có thể lâu hơn) · `--timeout-settle 1000`. Khai báo sẵn trong `.mcp.json` |
| Bằng chứng Phase 1 | MCP ghi ảnh vào `.playwright-mcp-output/` (`--output-dir`); `test-runner` gom về `.qa/<ID>/phase1/` bằng một lệnh `mv` sau khi chạy xong |
| Tiết kiệm token khi chụp nhiều | Thêm `--image-responses omit` vào args: ảnh vẫn được LƯU nhưng không nạp vào context. Đổi lại agent mất khả năng kiểm bằng mắt — chỉ bật khi case không cần đối chiếu hình ảnh |
| Session của MCP | `.playwright-mcp-profile/` (khai báo bằng `--user-data-dir` trong `.mcp.json`, đã gitignore). **Sống qua các lần chạy** — đăng nhập một lần dùng mãi tới khi hết hạn. Không khai báo thì MCP tạo thư mục tạm và mất session sau mỗi lần khởi động lại |
| Session của code | `scientec-e2e/playwright/.auth/user.json`, tạo bằng `npm run auth:headed`. **Tách biệt** với session MCP — hai đường chạy, hai session |
| Selector form đăng nhập | `LOGIN_PATH` · `LOGIN_EMAIL` · `LOGIN_PASSWORD` · `LOGIN_SUBMIT` · `LOGIN_2FA` · `LOGIN_REMEMBER` trong `<project e2e>/.env` — bỏ trống thì script dùng mặc định chung (placeholder `Enter your email` / `Enter your password`, nút `Login`) — **chỉ là giữ chỗ cho tới khi biết form đăng nhập của Scientec**. Tiền tố: `placeholder:` (mặc định) · `label:` · `testid:` · `text:` · `css:` · `role:<vai>/<tên>`. Khuôn và ví dụ ở `.env.example` |
| Tài khoản đăng nhập | `SCIENTEC_USER` / `SCIENTEC_PASS` trong `scientec-e2e/.env`. **KHÔNG điền form bằng MCP** — `browser_type({text: "<mật khẩu>"})` để lộ mật khẩu nguyên văn trong transcript. Đăng nhập bằng `node .claude/scripts/seed-mcp-profile.mjs`, script đọc `.env` trong tiến trình riêng |
| Thứ tự seed | Chạy script **TRƯỚC khi gọi bất kỳ tool MCP nào**. MCP khởi động browser lười, nhưng đã khởi động rồi thì giữ lock trên thư mục profile và script sẽ không mở được |
| Vận hành trình duyệt ở Phase 1 | Vòng đời một-phiên · ba mức reset · chờ bằng tín hiệu dương · xử khi bị đẩy về login — **[agents/reference/phase1-browser.md](agents/reference/phase1-browser.md)**. Để ở đó vì chỉ nhánh dò-bằng-MCP cần, còn mục này thì mọi chặng đều đọc |
| 2FA | Tài khoản QA hiện tại **đã tắt**. Bật lại thì agent dừng ở màn nhập mã và chờ người dùng gõ `ok` (xem `/qa-login`) |
| Phạm vi MCP | **CHỈ dùng bản project (`.mcp.json` ở gốc repo).** Máy có thêm server `playwright` ở scope `local` hoặc `user` là **xung đột**: chỉ một bản thắng, và bản thắng có thể không mang các tham số dưới. Gỡ bản kia bằng `claude mcp remove playwright -s local` (hoặc `-s user`) rồi khởi động lại session |
| Triệu chứng xung đột scope | Cấu hình `.mcp.json` **như không tồn tại**, không có lỗi nào báo — kiểm bằng `claude mcp list`. Bảng triệu chứng ↔ chẩn nhầm: [docs/DEAD-ENDS.md](../docs/DEAD-ENDS.md) §3 |
| MCP Playwright | Đã kèm sẵn trong `.mcp.json` ở **gốc repo**. Repo có `.mcp.json` riêng thì merge thêm: `claude mcp add playwright -- npx -y @playwright/mcp@latest`. Cần cho Phase 1 (dò element); case đã có spec thì không cần |
| Trình duyệt | `cd scientec-e2e && npx playwright install chromium` (thêm `install-deps chromium` nếu chạy trong container/CI) |
| Tên file spec | `scientec-e2e/tests/<ID>.spec.ts` — **một file cho một tính năng**, chứa toàn bộ case UI của tính năng |
| Describe block | tên màn hình, giữ nhất quán giữa các tính năng (để chạy regression theo màn hình) |
| Tiêu đề test | `TC-Y-NNN — <mô tả>` — chạy theo TC ID thì **luôn kèm đường dẫn file** |

| Trạng thái | Nghĩa |
|---|---|
| `CÓ` + thư mục **không** tồn tại | **SAI CẤU HÌNH**, không phải "chưa có": DỪNG, báo. Không tự tạo, không đoán vị trí khác. **Ngoại lệ duy nhất: đang chạy `/qa-setup`** — đó chính là chặng được phép dựng, và nó đổi Trạng thái sau khi dựng xong |
| `CHƯA CÓ` | chạy `/qa-setup` — skill `e2e-scaffold` dò repo, hỏi, rồi dựng. Agent KHÔNG tự init giữa chặng test |
| `KHÔNG DÙNG` | nhánh UI **skip, KHÔNG chặn `/qa-run`**: case UI ghi `Blocked` + `[MANUAL] không dùng project e2e — chạy tay`. Hợp lệ khi repo chỉ có API, hoặc team dùng framework khác |

Cùng quy ước với mục Postman.

## Production (dùng bởi `prod-verifier`)

| Khoá | Giá trị |
|---|---|
| URL | `PROD_BASE_URL` trong `.env` của project e2e — tạm `https://scientec.example.com` *(TODO: thay URL thật của Scientec)* |
| Account | `SCIENTEC_PROD_USER` / `SCIENTEC_PROD_PASS` — account QA riêng, quyền thấp nhất đủ để xem |
| Session | `playwright/.auth/prod.json` — tách hẳn khỏi session staging |
| Phạm vi chạy | **chỉ case gắn tag `@prod-safe`** (case chỉ xem, không ghi dữ liệu) |
| Lệnh | `cd scientec-e2e && npx playwright test --project=prod tests/<ID>.spec.ts` |
| Báo cáo | `.qa/<ID>/prod-verify-<ngày>.md` |

Production là **dữ liệu khách hàng thật**. Hàng rào `grep: /@prod-safe/` trong
`playwright.config.ts` là cứng: quên gắn tag thì case không chạy trên prod. Nghiêng về
phía bỏ sót có chủ đích — bỏ sót một case còn sửa được, sửa nhầm dữ liệu thật thì không.

KHÔNG dùng MCP Playwright trên production trong bất kỳ trường hợp nào.

## Postman / newman (dùng bởi `postman-api-test`, `test-runner`)

| Khoá | Giá trị |
|---|---|
| **Trạng thái** | **CHƯA CÓ — tạm SKIP nhánh API** |
| Collection | `tests/postman/scientec.postman_collection.json` |
| Environment | `tests/postman/environments/staging.postman_environment.json` |
| Report | `.qa/<ID>/result.json` — gom theo tính năng, không để ở gốc repo |

**Khi Trạng thái là `CHƯA CÓ`:** nhánh API được **skip, KHÔNG chặn cả chặng `/qa-run`**.
Case API ghi `Blocked` + Note `[MANUAL] chưa có Postman collection — chờ bổ sung`, và
`test-runner` phải báo rõ số case bị skip trong tổng kết. Nhánh UI vẫn chạy bình thường.

Marker `[MANUAL]` khiến `write_defects.py` không tạo defect cho các case này — đúng
mong muốn: chưa chạy thì chưa biết đúng sai, không phải là bug.

**Khi đã có collection:** đổi Trạng thái thành `CÓ`, xác nhận hai đường dẫn trên đúng
với repo thật, rồi chạy lại `/qa-run` — các case đang `[MANUAL] chưa có Postman
collection` sẽ được chạy thật ở round tiếp theo.

File environment chứa token/secret **không commit**. Trạng thái là `CÓ` mà collection
không tồn tại ở đường dẫn khai báo → đó là sai cấu hình: DỪNG và báo, không tạo
collection rỗng, không đoán vị trí khác.
