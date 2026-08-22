Feature('E2E - Customer Shopping Journey on UI @e2e @ui');

Scenario('Khách hàng đăng nhập, tìm kiếm sản phẩm, xem chi tiết và thêm vào giỏ hàng', async ({ I }) => {
  // 1. Mở trang Đăng nhập & đợi giao diện sẵn sàng
  I.openPage('/login');
  I.waitForElement('input#username', 10);
  I.wait(1.5);

  // 2. Nhập thông tin đăng nhập với nhịp điệu tự nhiên (tự động xóa sạch ô trước khi nhập)
  I.clearAndFillField('input#username', 'customer');
  I.wait(1);
  I.clearAndFillField('input[type="password"]', 'Passw0rd!');
  I.wait(1);

  // 3. Nhấn nút Đăng nhập & đợi chuyển trang
  I.safeClick('button[type="submit"]');
  I.wait(2.5);

  // 4. Tìm kiếm sản phẩm thương hiệu Apple
  I.openPage('/products?q=Apple');
  I.waitForElement('.product-card', 10);
  I.see('Apple');
  I.wait(2);

  // 5. Xem chi tiết sản phẩm đầu tiên
  I.safeClick('.product-card a');
  I.waitForElement('button:has-text("Thêm vào giỏ")', 10);
  I.wait(2);

  // 6. Thêm sản phẩm vào giỏ hàng
  I.safeClick('button:has-text("Thêm vào giỏ")');
  I.wait(2);

  // 7. Chuyển sang xem Giỏ hàng & kiểm tra nội dung
  I.openPage('/cart');
  I.waitForText('Giỏ hàng của bạn', 10);
  I.see('Giỏ hàng của bạn');
  I.wait(2.5);
});
