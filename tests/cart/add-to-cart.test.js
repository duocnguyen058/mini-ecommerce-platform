Feature('Cart - Add To Cart @cart @api');

Scenario('Thêm sản phẩm vào giỏ hàng thành công', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  const res = await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue(res.status === 200);
  I.assertTrue(Array.isArray(res.data.items));
  I.assertTrue(res.data.items.some(it => it.productId === '908d15f9-ae16-45d8-8bc8-d5d139bb6348'));
});
