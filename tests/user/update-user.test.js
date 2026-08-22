Feature('User - Update Profile & Validation @user @api');

Scenario('Cập nhật thành công thông tin hồ sơ cá nhân (Positive Update)', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  const res = await I.sendPutMapping ? await I.sendPutRequest('/api/users/me', {
    fullName: 'Khách Hàng Thân Thiết',
    phone: '0987654321'
  }, {
    Authorization: `Bearer ${token}`
  }) : await I.sendPutRequest('/api/users/me', {
    fullName: 'Khách Hàng Thân Thiết',
    phone: '0987654321'
  }, {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue(res.status === 200);
  I.assertEqual(res.data.fullName, 'Khách Hàng Thân Thiết');
});
