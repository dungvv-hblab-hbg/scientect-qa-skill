/**
 * Test data gom một chỗ, không rải giá trị hardcode trong thân test.
 * Case nào cần dữ liệu đặc thù thì khai báo ở đây và ghi rõ điều kiện, để người khác
 * biết cần seed gì trên staging.
 *
 * TODO: toàn bộ giá trị dưới là GIỮ CHỖ — thay bằng dữ liệu thật trên staging Scientec
 * (bản ghi dành riêng cho QA, không bị người khác sửa) khi viết spec thật.
 */

export const RECORD = {
  // TODO: một bản ghi ổn định trên staging, dành riêng cho QA.
  code: 'QA-0001',
  name: 'QA Sample Record',
};

/** Bản ghi ở trạng thái đặc thù — cần seed trước, không phải lúc nào cũng có. */
export const RECORD_IN_SPECIAL_STATE = {
  code: '',   // để trống nghĩa là chưa seed -> case liên quan đánh [MANUAL]
};
