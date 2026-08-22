Feature('Cart - Update Quantity & BVA @cart @api');

Scenario('Cập nhật số lượng sản phẩm trong giỏ hàng', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  // Add item first
  await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });

  // Update quantity to 3 via PATCH
  const res = await I.sendPatchRequest('/api/cart/items/908d15f9-ae16-45d8-8bc8-d5d139bb6348', {
    quantity: 3
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue(res.status === 200);
});
