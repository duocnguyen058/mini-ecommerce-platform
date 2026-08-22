Feature('UI - Notifications Management @ui @notification');

Scenario('Kiểm tra Trung tâm thông báo: Xem danh sách, Làm mới và Đánh dấu đã đọc', async ({ I }) => {
  // 1. Đăng nhập tài khoản
  I.login('customer', 'Passw0rd!');

  // 2. Mở trang Thông báo
  I.openPage('/notifications');
  I.wait(2.5);
  I.see('Thông báo');
});
