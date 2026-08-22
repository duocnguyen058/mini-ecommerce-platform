Feature('Admin - Orders Management & Stats @admin @order @api');

Scenario('Admin xem toàn bộ danh sách đơn hàng và thống kê', async ({ I }) => {
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const res = await I.sendGetRequest('/api/admin/orders', {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue(res.status === 200);
  I.assertTrue(Array.isArray(res.data.content || res.data));
});
