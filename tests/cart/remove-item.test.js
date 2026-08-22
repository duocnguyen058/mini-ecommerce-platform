Feature('Cart - Remove Item @cart @api');

Scenario('Xóa từng sản phẩm khỏi giỏ hàng', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  // Add item
  await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });

  // Remove item
  const res = await I.sendDeleteRequest('/api/cart/items/908d15f9-ae16-45d8-8bc8-d5d139bb6348', {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue([200, 204].includes(res.status));
});
