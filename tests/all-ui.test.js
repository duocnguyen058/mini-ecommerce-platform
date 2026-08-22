/**
 * Master UI Test Suite Runner — all-ui.test.js
 * 
 * Điều phối thực thi toàn bộ 12 module kiểm thử Giao diện Người dùng (UI) trên Chrome:
 * 1. Trang chủ & Điều hướng (01_homepage.ui.test.js)
 * 2. Đăng ký & Đăng nhập (02_auth.ui.test.js)
 * 3. Hồ sơ Cá nhân (03_profile.ui.test.js)
 * 4. Tìm kiếm, Lọc & Sắp xếp Catalog (04_catalog_search.ui.test.js)
 * 5. Chi tiết Sản phẩm & Tương tác (05_product_detail.ui.test.js)
 * 6. Danh sách Yêu thích (06_wishlist.ui.test.js)
 * 7. Giỏ hàng & Số lượng (07_cart.ui.test.js)
 * 8. Thanh toán & Đặt hàng (08_checkout.ui.test.js)
 * 9. Lịch sử & Chi tiết Đơn hàng (09_orders.ui.test.js)
 * 10. Trung tâm Thông báo (10_notifications.ui.test.js)
 * 11. Dashboard Quản trị Admin (11_admin.ui.test.js)
 * 12. Đăng xuất an toàn (12_logout.ui.test.js)
 */

const { spawn } = require('child_process');

function runAllUITests() {
  const isHeadless = process.env.HEADLESS === 'true';
  console.log(`\n🚀 Đang chạy toàn bộ 12 Phân hệ UI Testing trên Chrome (${isHeadless ? 'Headless Mode' : 'Cửa sổ 1280x800 - 1 Tab duy nhất'})...\n`);

  const child = spawn('npx', ['codeceptjs', 'run', '--steps'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      TEST_FILE: './ui/*.ui.test.js'
    }
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

if (require.main === module) {
  runAllUITests();
}

module.exports = runAllUITests;
