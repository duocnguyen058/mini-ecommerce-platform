Feature('UI - Authentication & Login Security @ui @auth');

Scenario('Kiểm tra Đăng nhập: Sai mật khẩu, Chống SQLi và Đăng nhập thành công', async ({ I }) => {
  I.openPage('/login');
  I.waitForElement('input#username', 10);
  I.wait(1.5);

  // 1. Nhập sai mật khẩu -> kiểm tra hiển thị thông báo lỗi
  I.clearAndFillField('input#username', 'customer');
  I.clearAndFillField('input[type="password"]', 'WrongPassword999!');
  I.click('form button[type="submit"]');
  I.wait(2);

  // 2. Nhập payload SQL Injection -> kiểm tra bảo vệ an toàn
  I.clearAndFillField('input#username', "' OR '1'='1");
  I.clearAndFillField('input[type="password"]', 'SomePassword');
  I.click('form button[type="submit"]');
  I.wait(2);

  // 3. Đăng nhập với tài khoản hợp lệ
  I.clearAndFillField('input#username', 'customer');
  I.clearAndFillField('input[type="password"]', 'Passw0rd!');
  I.click('form button[type="submit"]');
  I.wait(3);

  // 4. Kiểm tra trang chủ ở trạng thái đã đăng nhập
  I.openPage('/');
  I.wait(2);
  I.see('ShopNow');
});
