Feature('Admin - Catalog Management @admin @catalog @api');

Scenario('Admin truy cập danh sách quản trị sản phẩm và danh mục', async ({ I }) => {
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const res = await I.sendGetRequest('/api/products', {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue(res.status === 200);
});
