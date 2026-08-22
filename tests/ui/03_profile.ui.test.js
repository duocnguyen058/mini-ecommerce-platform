Feature('UI - User Profile Management @ui @profile');

Scenario('Kiểm tra Trang cá nhân: Xem thông tin, Chỉnh sửa Họ Tên, SĐT và Lưu thay đổi', async ({ I }) => {
  // 1. Đăng nhập trước
  I.login('customer', 'Passw0rd!');

  // 2. Mở trang cá nhân
  I.openPage('/profile');
  I.waitForText('Thông tin cá nhân', 10);
  I.wait(1.5);
  I.see('customer');
  I.see('Khách hàng');

  // 3. Nhấn Chỉnh sửa
  I.safeClick('button:has-text("Chỉnh sửa")');
  I.wait(1);

  // 4. Nhập Họ Tên và Số điện thoại mới
  I.clearAndFillField('input[placeholder="Nhập họ và tên"]', 'Khách Hàng Thân Thiết Pro');
  I.clearAndFillField('input[placeholder="Nhập số điện thoại"]', '0987654321');
  I.wait(1);

  // 5. Nhấn Lưu
  I.safeClick('button:has-text("Lưu")');
  I.wait(2.5);
  I.see('Khách Hàng Thân Thiết Pro');
});
