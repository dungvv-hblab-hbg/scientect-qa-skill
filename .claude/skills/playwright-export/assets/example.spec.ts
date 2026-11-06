import { test, expect } from '@playwright/test';

/**
 * INV-001 — Invoice Detail
 * Test case: .qa/INV-001/TCs_Invoice-Detail_v1.0.xlsx
 * Màn hình: Invoice Detail
 *
 * MỘT FILE CHO MỘT TÍNH NĂNG: tên file là feature ID (tests/INV-001.spec.ts), chứa toàn
 * bộ case UI của tính năng kể cả khi đụng nhiều màn hình (thêm describe, không thêm file).
 * Chạy từ trong thư mục scientec-e2e:
 *   npx playwright test --project=chromium tests/INV-001.spec.ts                 # cả tính năng
 *   npx playwright test --project=chromium tests/INV-001.spec.ts -g "TC-A-001"   # một case
 *
 * Tên describe đặt theo màn hình và giữ nhất quán giữa các tính năng, để chạy regression
 * theo màn hình xuyên tính năng: npx playwright test --project=chromium -g "Invoice Detail"
 * Session login được tái dùng qua storageState (cấu hình ở playwright.config.ts,
 * project 'chromium' -> dependencies ['setup']). KHÔNG login trong file này.
 */

/**
 * Test data gom một chỗ, không rải giá trị hardcode trong thân test.
 * Khi có fixture thật thì thay khối này bằng import từ fixture; mọi test bên
 * dưới không phải sửa.
 */
const INVOICE = {
  number: 'INV-1001',
  customer: 'Acme Laboratories Pty Ltd',
};

test.describe('Invoice Detail', () => {
  // Điều hướng chung cho cả nhóm: mở trang chi tiết một invoice mẫu.
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices');
    await page.getByRole('row').filter({ hasText: INVOICE.number }).first().click();
  });

  test('TC-A-001 — mở trang chi tiết từ Invoice list, title là tên khách hàng', async ({ page }) => {
    // Expected Result (từ Excel):
    // 1. Mở đúng trang chi tiết của invoice vừa chọn
    // 2. Tiêu đề là tên khách hàng, không phải số invoice
    await expect(page).toHaveURL(/\/invoices\/[\w-]+/);

    // Assert DƯƠNG: kiểm cái ĐÚNG phải hiện.
    // `not.toHaveText(number)` sẽ pass cả khi heading rỗng hoặc trang lỗi 500 —
    // nó không chứng minh được tiêu đề đang hiển thị tên khách hàng.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(INVOICE.customer);
  });

  test('TC-A-002 — trang cuộn đơn, không có tab bar', async ({ page }) => {
    // Expected: không có tab bar; các card xếp theo thứ tự thiết kế.
    // Expected nói về SỰ VẮNG MẶT -> phủ định ở đây là đúng.
    await expect(page.getByRole('tablist')).toHaveCount(0);

    // Nhưng vẫn kèm một assert dương để chắc trang đã render, không phải trang trắng.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('TC-B-001 — banner quá hạn hiện khi invoice đã quá due date', async ({ page }) => {
    // Expected: banner đỏ hiện trên cùng; text "This invoice is {n} days overdue"
    // Cần test data là invoice ĐANG quá hạn. Không có fixture phù hợp thì:
    //   test.skip(true, 'cần invoice đang quá hạn');
    // và báo test-runner ghi [MANUAL] vào cột Note của Excel.
    const overdueBanner = page.getByText(/days overdue/i);
    await expect(overdueBanner).toBeVisible();
  });

  test('TC-C-004 — bỏ trống due date thì hiện message lỗi nguyên văn', async ({ page }) => {
    // Ví dụ case Type = Validation: vẫn thao tác được trên UI nên VẪN export,
    // không đẩy sang Manual.
    // Expected: 'Due date is required.'  (trích nguyên văn từ D2 checklist)
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Due date').fill('');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Due date is required.')).toBeVisible();
  });
});
