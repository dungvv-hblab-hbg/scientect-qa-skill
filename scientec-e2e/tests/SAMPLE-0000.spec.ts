import { test, expect } from '@playwright/test';
import { RECORD } from '../fixtures/test-data';

/**
 * SAMPLE-0000 — FILE MẪU, xoá khi có tính năng thật.
 * Spec: specs/SAMPLE-0000.md  ·  Test case: .qa/SAMPLE-0000/TCs_Example_v1.0.xlsx
 * Màn hình: Record List, Record Detail (TODO: màn hình giữ chỗ — thay theo app Scientec)
 *
 * MỘT FILE CHO MỘT TÍNH NĂNG. Tên file là feature ID; toàn bộ case UI của tính năng
 * nằm trong đây, kể cả khi nó đụng nhiều màn hình (thêm describe, không thêm file).
 *
 *   npx playwright test --project=chromium tests/SAMPLE-0000.spec.ts                 # cả tính năng
 *   npx playwright test --project=chromium tests/SAMPLE-0000.spec.ts -g "TC-A-001"   # một case
 *
 * Chạy theo TC ID thì LUÔN kèm đường dẫn file: TC ID chỉ duy nhất trong một tính năng,
 * `-g "TC-A-001"` trần sẽ vớ phải case của tính năng khác.
 *
 * Tên describe đặt theo màn hình và giữ nhất quán giữa các tính năng, để chạy regression
 * theo màn hình xuyên tính năng:  npx playwright test --project=chromium -g "Record Detail"
 *
 * KHÔNG login ở đây — session đã có sẵn qua storageState.
 *
 * TAG @prod-safe: gắn cho case CHỈ XEM, không tạo/sửa/xoá dữ liệu. Chỉ những case
 * gắn tag này mới chạy khi verify sau deploy (`npm run test:prod`) — vì trên
 * production là dữ liệu khách hàng thật. Quên gắn thì case không chạy trên prod;
 * thà bỏ sót còn hơn sửa nhầm dữ liệu thật.
 */

test.describe('Record List', () => {
  // Chỉ mở trang và đọc -> an toàn trên production.
  test('TC-A-001 — mở trang chi tiết từ danh sách', { tag: '@prod-safe' }, async ({ page }) => {
    // Expected Result (từ cột I của Excel):
    // 1. Mở đúng trang chi tiết của bản ghi vừa chọn
    // 2. Tiêu đề là tên bản ghi, không phải mã
    await page.goto('/records'); // TODO: route giữ chỗ

    await page
      .getByRole('row')
      .filter({ hasText: RECORD.code })
      .first()
      .click();

    // Assertion DƯƠNG: assert cái ĐÚNG phải hiện, đừng chỉ assert cái sai không hiện.
    await expect(page.getByRole('heading', { name: RECORD.name })).toBeVisible();
  });
});

test.describe('Record Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Điều hướng chung cho cả nhóm.
    await page.goto('/records'); // TODO: route giữ chỗ
    await page.getByRole('row').filter({ hasText: RECORD.code }).first().click();
  });

  // KHÔNG gắn @prod-safe: case này bấm Save, tức là ghi vào dữ liệu thật.
  test('TC-B-001 — bỏ trống tên thì hiện message lỗi nguyên văn', async ({ page }) => {
    // Expected Result: hiện message "Name is required."
    // Message trích nguyên văn từ mục D2 của checklist — đừng viết lại cho gọn.
    await page.getByLabel('Name').fill('');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Name is required.')).toBeVisible();
  });

  // Chỉ nhìn -> an toàn trên production.
  test('TC-B-002 — trang chi tiết không có tab bar', { tag: '@prod-safe' }, async ({ page }) => {
    // Expected Result nói về sự VẮNG MẶT -> đây là chỗ hợp lệ để dùng phủ định.
    await expect(page.getByRole('tablist')).toHaveCount(0);
  });

  // Case cần dữ liệu đặc thù chưa seed được: skip có lý do, đừng để lửng.
  // test-runner sẽ ghi Blocked + Note "[MANUAL] cần bản ghi ở trạng thái đặc thù".
  test.skip('TC-C-001 — cảnh báo hiện khi bản ghi ở trạng thái đặc thù', async () => {
    // TODO: cần seed một bản ghi ở trạng thái đặc thù trên staging (RECORD_IN_SPECIAL_STATE).
  });
});
