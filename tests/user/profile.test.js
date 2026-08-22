Feature('User - Profile Management @user @api');

Scenario('Lấy thông tin tài khoản người dùng hiện tại (Get Profile)', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  const res = await I.sendGetRequest('/api/users/me', {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue(res.status === 200);
  I.assertEqual(res.data.username, 'customer');
  I.assertTrue(typeof res.data.fullName === 'string');
});
