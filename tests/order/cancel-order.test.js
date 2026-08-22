Feature('Order - Cancel Order @order @api');

Scenario('Khách hàng hủy đơn hàng đang ở trạng thái PENDING', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  // Add item & Checkout
  await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });

  const orderRes = await I.sendPostRequest('/api/checkout', {
    shippingAddress: {
      recipient: 'Nguyễn Văn Hủy',
      phone: '0901234567',
      streetLine: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh'
    },
    paymentMethod: 'COD'
  }, {
    Authorization: `Bearer ${token}`
  });

  const orderId = orderRes.data.id;

  // Cancel order
  const cancelRes = await I.sendPostRequest(`/api/orders/${orderId}/cancel`, {
    reason: 'Đổi ý không muốn mua nữa'
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue([200, 204].includes(cancelRes.status));
});
