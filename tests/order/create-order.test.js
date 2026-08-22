Feature('Order - Create Order & Checkout @order @api');

Scenario('Tạo đơn hàng mới từ giỏ hàng thành công (Checkout COD)', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  // 1. Add item to cart
  await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });

  // 2. Checkout
  const res = await I.sendPostRequest('/api/checkout', {
    shippingAddress: {
      recipient: 'Nguyễn Văn Khách',
      phone: '0901234567',
      streetLine: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh'
    },
    paymentMethod: 'COD'
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue([200, 201, 202].includes(res.status));
  I.assertTrue(typeof res.data.id === 'string');
  I.assertEqual(res.data.status, 'PENDING');
});
