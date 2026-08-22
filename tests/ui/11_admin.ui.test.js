Feature('UI - Admin Dashboard & Management @ui @admin');

Scenario('Kiểm tra Dashboard Quản trị: Xem số liệu KPIs, Quản lý Sản phẩm, Tồn kho và Đơn hàng', async ({ I }) => {
  // 1. Đăng nhập với tài khoản Admin
  I.login('admin', 'Passw0rd!');

  // 2. Mở Dashboard Admin
  I.openPage('/admin');
  I.wait(2.5);
  I.see('QUẢN TRỊ');
  I.see('Tổng quan');

  // 3. Chuyển sang Quản lý Sản phẩm
  I.openPage('/admin/products');
  I.wait(2);
  I.see('Sản phẩm');

  // 4. Chuyển sang Quản lý Tồn kho
  I.openPage('/admin/inventory');
  I.wait(2);
  I.see('Tồn kho');

  // 5. Chuyển sang Quản lý Đơn hàng
  I.openPage('/admin/orders');
  I.wait(2);
  I.see('Đơn hàng');

  // 6. Chuyển sang Quản lý Người dùng
  I.openPage('/admin/users');
  I.wait(2);
  I.see('Người dùng');
});
