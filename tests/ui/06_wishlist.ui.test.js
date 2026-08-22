Feature('UI - Wishlist Management @ui @wishlist');

Scenario('Kiểm tra Danh sách yêu thích: Xem danh sách, Thao tác Yêu thích và Điều hướng', async ({ I }) => {
  // 1. Mở trang Wishlist
  I.openPage('/wishlist');
  I.waitForElement('h1', 10);
  I.wait(1.5);
  I.see('Danh sách yêu thích');

  // 2. Chuyển sang xem sản phẩm
  I.safeClick('a:has-text("Tiếp tục mua sắm")');
  I.wait(2);
  I.seeInCurrentUrl('/products');
});
