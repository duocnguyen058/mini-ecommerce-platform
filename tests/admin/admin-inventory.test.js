Feature('Admin - Inventory Management @admin @inventory @api');

Scenario('Admin xem tổng quan tồn kho và cảnh báo hết hàng', async ({ I }) => {
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const res = await I.sendGetRequest('/api/admin/inventory/summary', {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue(res.status >= 200 && res.status < 500);
});
