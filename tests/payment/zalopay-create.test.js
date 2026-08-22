Feature('Payment - ZaloPay Create Order @payment @zalopay @api');

Scenario('Khởi tạo giao dịch ZaloPay Sandbox thành công', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;
  const userId = authRes.data.userId || 'b0000000-0000-0000-0000-000000000002';

  // Checkout
  await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });

  const checkoutRes = await I.sendPostRequest('/api/checkout', {
    shippingAddress: {
      recipient: 'Nguyễn Văn Zalo',
      phone: '0901234567',
      streetLine: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh'
    },
    paymentMethod: 'ZALOPAY'
  }, {
    Authorization: `Bearer ${token}`
  });

  const orderId = checkoutRes.data.id;

  const res = await I.sendPostRequest('/api/payment/zalopay/create', {
    orderId: orderId,
    userId: userId,
    amount: 1500000,
    description: `Thanh toan don #${checkoutRes.data.orderNumber}`
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue(res.status === 200);
  I.assertEqual(res.data.status, 'PENDING');
  I.assertTrue(typeof res.data.orderUrl === 'string' && res.data.orderUrl.length > 0);
});
