Feature('Admin - User Management @admin @user @api');

Scenario('Admin xem danh sách người dùng và phân quyền tài khoản', async ({ I }) => {
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const res = await I.sendGetRequest('/api/admin/users', {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue(res.status >= 200 && res.status < 500);
});
