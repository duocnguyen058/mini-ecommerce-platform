Feature('UI - Product Catalog, Search & Filters @ui @catalog');

Scenario('Kiểm tra Tìm kiếm, Bộ lọc thương hiệu, Khoảng giá, Sắp xếp và Tiếng Việt có dấu', async ({ I }) => {
  // 1. Tìm kiếm theo từ khoá thương hiệu trên Navbar
  I.openPage('/');
  I.waitForElement('input[placeholder*="Tìm sản phẩm"]', 10);
  I.clearAndFillField('input[placeholder*="Tìm sản phẩm"]', 'Apple');
  I.safeClick('button:has-text("Tìm")');
  I.wait(2.5);

  // Kiểm tra kết quả tìm kiếm
  I.seeInCurrentUrl('/products');
  I.waitForElement('.product-card', 10);
  I.see('Apple');
  I.wait(1.5);

  // 2. Lọc theo khoảng giá
  I.openPage('/products?maxPrice=15000000');
  I.waitForElement('.product-card', 10);
  I.seeElement('.product-card');
  I.wait(2);

  // 3. Sắp xếp theo giá tăng dần
  I.openPage('/products?sort=price,asc');
  I.waitForElement('.product-card', 10);
  I.seeElement('.product-card');
  I.wait(2);

  // 4. Tìm kiếm từ khoá Tiếng Việt Unicode
  I.openPage('/products?q=Điện thoại thông minh');
  I.wait(2);
  I.seeInCurrentUrl('/products');
});
