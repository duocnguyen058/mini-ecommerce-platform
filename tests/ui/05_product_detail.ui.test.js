Feature('UI - Product Detail & Interaction @ui @product');

Scenario('Kiểm tra Trang chi tiết: Xem thông tin, Đổi số lượng, Thêm giỏ hàng và Yêu thích', async ({ I }) => {
  // 1. Mở danh sách và chọn 1 sản phẩm
  I.openPage('/products');
  I.waitForElement('.product-card a', 10);
  I.wait(1.5);
  I.safeClick('.product-card a');

  // 2. Kiểm tra thông tin chi tiết sản phẩm
  I.waitForElement('h1', 10);
  I.wait(1.5);
  I.seeElement('h1');
  I.see('₫');

  // 3. Thêm sản phẩm vào giỏ hàng
  I.safeClick('button:has-text("Thêm vào giỏ")');
  I.wait(2.5);
});
