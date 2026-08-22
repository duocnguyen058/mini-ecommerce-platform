Feature('UI - Cart Operations & Quantity Management @ui @cart');

Scenario('Kiểm tra Giỏ hàng: Thêm sản phẩm, Xem giỏ hàng và Tiến hành thanh toán', async ({ I }) => {
  // 1. Đăng nhập tài khoản
  I.login('customer', 'Passw0rd!');

  // 2. Mở sản phẩm và thêm vào giỏ hàng
  I.openPage('/products');
  I.waitForElement('.product-card a', 10);
  I.wait(1.5);
  I.safeClick('.product-card a');

  I.waitForElement('button:has-text("Thêm vào giỏ")', 10);
  I.wait(1.5);
  I.safeClick('button:has-text("Thêm vào giỏ")');
  I.wait(2.5);

  // 3. Mở trang Giỏ hàng
  I.openPage('/cart');
  I.waitForText('Giỏ hàng của bạn', 10);
  I.wait(2);
  I.see('Tóm tắt đơn hàng');

  // 4. Bấm Tiến hành thanh toán
  I.safeClick('button:has-text("Tiến hành thanh toán")');
  I.wait(2.5);
  I.seeInCurrentUrl('/checkout');
});
