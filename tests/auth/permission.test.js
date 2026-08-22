Feature('Auth - Permission & Role Based Access Control @auth @permission @api');

Scenario('Chặn người dùng chưa đăng nhập truy cập API Admin (401 Unauthorized)', async ({ I }) => {
  const res = await I.sendGetRequest('/api/admin/orders');
  I.assertTrue([401, 403].includes(res.status));
});

Scenario('Chặn tài khoản Customer truy cập API Admin (403 Forbidden)', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  const res = await I.sendGetRequest('/api/admin/orders', {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue([401, 403].includes(res.status));
});
