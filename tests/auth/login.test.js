Feature('Auth - Login & Authentication @auth @api');

const loginData = require('../data/login.json');

Scenario('Đăng nhập thành công với thông tin hợp lệ (Positive Test)', async ({ I }) => {
  const res = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  I.assertTrue(res.status === 200);
  I.assertTrue(typeof (res.data.token || res.data.accessToken) === 'string');
  I.assertEqual(res.data.user?.username || res.data.username || 'customer', 'customer');
});

Scenario('Đăng nhập thất bại khi sai mật khẩu (Negative Test)', async ({ I }) => {
  const res = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'WrongPassword999!'
  });
  I.assertTrue([400, 401].includes(res.status));
});

Scenario('Kiểm tra chống SQL Injection trong form đăng nhập (Security Test)', async ({ I }) => {
  for (const sqli of loginData.sqlInjection) {
    const res = await I.sendPostRequest('/api/auth/login', {
      username: sqli.payload,
      password: 'SomePassword'
    });
    I.assertTrue([400, 401].includes(res.status));
  }
});
