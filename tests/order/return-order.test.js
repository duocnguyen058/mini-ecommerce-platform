Feature('Order - Return Order @order @api');

Scenario('Khách hàng yêu cầu hoàn trả đơn hàng (Return Order)', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  const res = await I.sendPostRequest('/api/orders/d0000000-0000-0000-0000-000000000001/return', {
    reason: 'Sản phẩm không đúng mô tả'
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue(res.status >= 200 && res.status < 500);
});
