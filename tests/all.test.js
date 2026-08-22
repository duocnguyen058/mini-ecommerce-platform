/**
 * Master Test Suite Runner — all.test.js
 * 
 * Điều phối thực thi toàn bộ 14 module kiểm thử:
 * 1. Auth & Permission (@auth)
 * 2. User & Profile (@user)
 * 3. Catalog, Brands & Categories (@catalog)
 * 4. Inventory & Concurrency (@inventory)
 * 5. Cart Management (@cart)
 * 6. Order Lifecycle (@order)
 * 7. ZaloPay Payment (@payment)
 * 8. Notification Service (@notification)
 * 9. Review & Rating (@review)
 * 10. Shipping Validation (@shipping)
 * 11. Admin Operations (@admin)
 * 12. End-to-End Business Integration Flow (@integration)
 * 13. UI Customer Shopping Journey (@e2e)
 */

const { spawn } = require('child_process');

function runAllTests() {
  const isHeadless = process.env.HEADLESS === 'true';
  console.log(`🚀 Running Mini E-Commerce Master Test Suite (${isHeadless ? 'Headless Mode' : 'Headed Chrome Mode'})...\n`);
  
  const child = spawn('npx', ['codeceptjs', 'run', '--steps'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

if (require.main === module) {
  runAllTests();
}

module.exports = runAllTests;
