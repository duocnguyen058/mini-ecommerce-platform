const { I } = inject();

Given('Người dùng đang ở trang chủ', () => {
  I.amOnPage('/');
  I.see('Mini E-Commerce');
});

When('Người dùng tìm kiếm từ khoá {string}', (keyword) => {
  I.fillField('input[placeholder*="Tìm kiếm"]', keyword);
  I.pressKey('Enter');
});

Then('Hệ thống hiển thị danh sách sản phẩm liên quan đến {string}', (keyword) => {
  I.see(keyword);
});

When('Người dùng thêm sản phẩm vào giỏ hàng', () => {
  I.click('button:has-text("Thêm vào giỏ")');
});

Then('Giỏ hàng cập nhật số lượng sản phẩm', () => {
  I.seeElement('.cart-badge');
});
