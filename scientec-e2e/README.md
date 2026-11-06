# scientec-e2e

Project Playwright cho app Scientec. Đây là **hạ tầng ngoài** của
harness QA Scientec — harness chỉ trỏ tới đây, không quản lý nó.

Mặc định nằm ở `scientec-e2e/` ở gốc repo (đường dẫn khai báo ở
`.claude/qa-config.md`, mục Playwright).

> **TODO:** URL staging/production và selector form đăng nhập hiện là **giữ chỗ**
> (`https://scientec-staging.example.com`, `https://scientec.example.com`, form chung
> `Enter your email` / `Enter your password` / `Login`). Thay bằng giá trị thật của
> Scientec trước khi chạy `npm run check`.

## Cài đặt

```bash
cd scientec-e2e
npm install                        # tự tải chromium qua postinstall
npx playwright install chromium    # chạy tay nếu postinstall bị bỏ qua
cp .env.example .env               # rồi điền SCIENTEC_USER / SCIENTEC_PASS
```

Phần dò element bằng MCP Playwright (Phase 1 của harness) cần server MCP. Harness đã
kèm `.mcp.json` ở gốc repo; repo đã có `.mcp.json` riêng thì merge thêm:

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

Kiểm bằng `/mcp`. Tool chưa hiện thì khởi động lại session Claude Code.

`.env` và `playwright/.auth/` đã nằm trong `.gitignore`. Đừng gỡ.

## Bốn lệnh cần biết

```bash
npm run check      # 1. kiểm hạ tầng — KHÔNG cần login, chạy đầu tiên
npm run auth       # 2. đăng nhập staging một lần, lưu session
                   #    có 2FA thì dùng: npm run auth:headed (tự nhập mã trong cửa sổ)
npm test           # 3. chạy toàn bộ spec trên staging
npm run test:prod  # 4. verify sau khi deploy — CHỈ case @prod-safe, trên production
```

**Chạy `npm run check` trước tiên.** Nó kiểm hai thứ mà mọi test khác đều dựa vào:
tới được staging, và form login đúng selector mà `auth.setup.ts` giả định. Đỏ ở đây
thì sửa ở đây, đừng đi tiếp — nếu không mọi spec sẽ cùng đỏ với lý do khó hiểu.

**Chưa verify trên Scientec** — selector mặc định là giữ chỗ (xem TODO ở đầu file).

## Verify sau khi deploy lên production

Tính năng verify xong trên staging, deploy lên prod, rồi chạy lại bằng **code** (không
dùng MCP) để chắc production đúng như staging:

```bash
npm run test:prod
npm run test:prod -- tests/INV-001.spec.ts    # chỉ một tính năng
```

### Chỉ case gắn `@prod-safe` mới chạy

Trên production là **dữ liệu khách hàng thật**. Case tạo/sửa/xoá mà chạy lên đó là
hỏng dữ liệu thật, không phải test.

Gắn tag cho case **chỉ xem**:

```ts
test('TC-A-001 — mở trang chi tiết', { tag: '@prod-safe' }, async ({ page }) => {
```

Project `prod` lọc bằng `grep: /@prod-safe/`. **Quên gắn thì case không chạy trên
prod** — hàng rào cố ý nghiêng về phía bỏ sót, vì bỏ sót một case còn sửa được, sửa
nhầm dữ liệu khách hàng thì không.

Case ghi dữ liệu vẫn có hai đường: seed sẵn bản ghi dành riêng cho QA trên prod rồi
gắn tag, hoặc để nguyên không tag và verify tay.

### Tài khoản có bật 2FA

`auth.setup.ts` điền email + mật khẩu từ `.env`, nhưng **mã 2FA thì không tự động hoá
được** — mà cũng không nên, mã chỉ bạn mới có.

```bash
npm run auth:headed        # staging
npm run auth:prod:headed   # production
```

Cửa sổ hiện lên, bạn nhập mã trong đó. Script chờ tối đa **3 phút** rồi mới báo lỗi
kèm hướng dẫn, không treo im lặng. Chạy headless mà tài khoản có 2FA thì sẽ hết giờ —
đó là hành vi đúng, không phải bug.

Session lưu xong thì các lần `npm test` sau không cần đăng nhập lại cho tới khi hết hạn.

### Tài khoản và session tách riêng

`.env` cần `PROD_BASE_URL`, `SCIENTEC_PROD_USER`, `SCIENTEC_PROD_PASS`. Dùng **account
QA riêng trên prod, quyền thấp nhất đủ để xem** — đừng dùng account admin, đừng dùng
chung với staging.

Session prod lưu riêng ở `playwright/.auth/prod.json`. Dùng chung một file session cho
hai môi trường là đường ngắn nhất tới chuyện chạy nhầm test lên prod.

`auth.prod.setup.ts` còn chặn thêm: `PROD_BASE_URL` mà chứa `stage`/`staging`/
`localhost` thì dừng ngay.

## Chạy spec

```bash
npx playwright test --project=chromium tests/INV-001.spec.ts                  # cả tính năng, một lệnh
npx playwright test --project=chromium tests/INV-001.spec.ts -g "TC-A-001"    # một case
npx playwright test --project=chromium -g "Record Detail"                     # regression theo màn hình
npx playwright test --project=chromium --headed                               # xem trình duyệt chạy
npm run report                                             # mở HTML report
```

**Chạy theo TC ID thì luôn kèm đường dẫn file.** TC ID chỉ duy nhất trong một tính năng,
`-g "TC-A-001"` trần sẽ vớ phải case của tính năng khác.

## Cấu trúc

```
tests/            spec theo tính năng — MỘT FILE CHO MỘT FEATURE ID
  SAMPLE-0000.spec.ts file mẫu, xoá khi có tính năng thật
checks/           kiểm hạ tầng, không cần login, KHÔNG phải test case của tính năng
fixtures/         test data gom một chỗ, không rải hardcode trong thân test
auth.setup.ts     đăng nhập staging -> playwright/.auth/user.json
auth.prod.setup.ts đăng nhập production -> playwright/.auth/prod.json
playwright.config.ts
```

Ba project trong config:

| Project | Chạy gì | Cần login |
|---|---|---|
| `setup` | `auth.setup.ts` | — |
| `chromium` | `tests/*.spec.ts` | có, qua `storageState` |
| `check` | `checks/*.spec.ts` | không |
| `setup-prod` | `auth.prod.setup.ts` | — |
| `prod` | `tests/*.spec.ts` nhưng **chỉ case `@prod-safe`** | có, session prod riêng |

## Convention (khớp với harness)

- **Một file cho một tính năng:** `tests/<ID>.spec.ts` chứa toàn bộ case UI của
  tính năng, kể cả khi nó đụng nhiều màn hình — thêm `describe`, không thêm file.
- **Tên describe theo màn hình**, giữ nhất quán giữa các tính năng, để chạy regression
  theo màn hình xuyên tính năng.
- **Tiêu đề test:** `TC-Y-NNN — <mô tả>`, đúng TC ID trong file Excel.
- **Không login trong spec**, không hardcode credential. Session đã có sẵn.
- **Locator theo thứ tự ưu tiên:** `getByRole` → `getByLabel`/`getByPlaceholder` →
  `getByTestId` → `getByText` → CSS/XPath (đánh dấu `// TODO` khi phải dùng).
- **Assertion dương.** `not.toBeVisible()` pass cả khi trang lỗi 500 — nó không
  chứng minh được gì. Chỉ dùng phủ định khi Expected Result nói về sự vắng mặt.
- **Test data vào `fixtures/`**, không rải giá trị trong thân test.
- **Gắn `@prod-safe`** cho case chỉ xem, để nó chạy được ở bước verify sau deploy.
  Case có ghi dữ liệu thì đừng gắn.

## Bằng chứng khi fail

`trace` / `screenshot` / `video` đã bật ở chế độ on-failure. Artifact rơi vào
`test-results/`. Harness lấy message và screenshot từ đó làm Actual Result cho bug —
đừng tắt ba dòng đó trong config.

## Lưu ý về staging

Nếu app là SPA nặng, **lần tải nguội đầu ngày có thể mất hơn 30 giây** mới render xong
form login, và lần khởi động trình duyệt đầu tiên còn lâu hơn.
Vì vậy `timeout` toàn cục để 60s, và các chỗ chờ form dùng 45s. Nếu thấy test đứt với
"element not found" ngay lần chạy đầu buổi sáng, chạy lại một lần trước khi kết luận
là selector sai.

`ignoreHTTPSErrors: true` đang bật phòng khi chứng chỉ staging không hợp lệ với một số máy.

## Khi chạy trong container / CI

Chromium cần thêm thư viện hệ thống:

```bash
npx playwright install-deps chromium
```

Flag `--no-sandbox --disable-gpu --disable-dev-shm-usage` đã đặt sẵn trong config.
