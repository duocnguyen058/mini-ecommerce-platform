Feature('Cart - Clear Cart @cart @api');

Scenario('Xóa sạch toàn bộ giỏ hàng', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  const res = await I.sendDeleteRequest('/api/cart', {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue([200, 204].includes(res.status));
});
