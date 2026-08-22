Feature('UI - User Logout & Session Cleanup @ui @auth');

Scenario('Kiểm tra Đăng xuất tài khoản an toàn và xóa Session', async ({ I }) => {
  // 1. Đăng nhập trước
  I.login('customer', 'Passw0rd!');

  // 2. Mở trang Profile
  I.openPage('/profile');
  I.wait(2);
  I.see('Đăng xuất');

  // 3. Nhấn nút Đăng xuất
  I.safeClick('button:has-text("Đăng xuất")');
  I.wait(2.5);

  // 4. Kiểm tra trở lại trang chủ và hiển thị nút Đăng nhập
  I.openPage('/');
  I.wait(2);
  I.see('Đăng nhập');
});
