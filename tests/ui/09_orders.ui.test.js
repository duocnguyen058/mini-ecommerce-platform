Feature('UI - Order History & Order Details @ui @orders');

Scenario('Kiểm tra Quản lý đơn hàng: Xem danh sách đơn, Lọc trạng thái và Xem chi tiết', async ({ I }) => {
  // 1. Đăng nhập tài khoản trực quan
  I.login('customer', 'Passw0rd!');

  // 2. Mở trang đơn hàng
  I.openPage('/orders');
  I.waitForElement('h1', 15);
  I.wait(2);
  I.see('Đơn hàng của tôi');
  I.see('Tất cả');
  I.see('Chờ xác nhận');

  // 3. Bấm lọc đơn hàng theo tab Chờ xác nhận
  I.safeClick('button:has-text("Chờ xác nhận")');
  I.wait(2);

  // 4. Bấm lại tab Tất cả
  I.safeClick('button:has-text("Tất cả")');
  I.wait(2);
});
