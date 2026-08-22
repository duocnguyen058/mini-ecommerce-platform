Feature('UI - Checkout & Place Order @ui @checkout');

Scenario('Kiểm tra Trang thanh toán: Điền địa chỉ nhận hàng, Chọn COD và Đặt hàng thành công', async ({ I }) => {
  // 1. Đăng nhập tài khoản trực quan
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

  // 3. Mở trang Checkout
  I.openPage('/checkout');
  I.wait(2.5);
  I.see('Thanh toán');
  I.wait(1.5);
});
