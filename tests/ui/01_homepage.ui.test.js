Feature('UI - Homepage & Navigation @ui @homepage');

Scenario('Kiểm tra Trang chủ: Banner, Danh mục, Sản phẩm nổi bật, Hàng mới về', async ({ I }) => {
  // 1. Mở trang chủ
  I.openPage('/');
  I.waitForElement('nav', 10);
  I.wait(1.5);

  // 2. Kiểm tra Header & Navbar
  I.see('ShopNow');
  I.seeElement('input[placeholder*="Tìm sản phẩm"]');
  I.see('Giỏ hàng');
  I.see('Yêu thích');
  I.wait(1);

  // 3. Kiểm tra Thanh danh mục nhanh
  I.see('Điện thoại & Tablet');
  I.see('Laptop');
  I.see('Âm thanh');
  I.wait(1);

  // 4. Kiểm tra lưới sản phẩm
  I.waitForElement('.product-card', 10);
  I.seeElement('.product-card');
  I.see('Hàng Mới Về');
  I.wait(1.5);
});
