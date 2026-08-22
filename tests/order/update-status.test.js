Feature('Order - Update Status & State Machine @order @api');

Scenario('Admin cập nhật trạng thái đơn hàng (PENDING -> CONFIRMED)', async ({ I }) => {
  // 1. Create a fresh order
  const customerAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const customerToken = customerAuth.data.token || customerAuth.data.accessToken;

  await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${customerToken}`
  });

  const orderRes = await I.sendPostRequest('/api/checkout', {
    shippingAddress: {
      recipient: 'Nguyễn Văn Test State Machine',
      phone: '0901234567',
      streetLine: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh'
    },
    paymentMethod: 'COD'
  }, {
    Authorization: `Bearer ${customerToken}`
  });

  const orderId = orderRes.data.id;

  // 2. Admin updates status
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const res = await I.sendPatchRequest(`/api/admin/orders/${orderId}/status`, {
    newStatus: 'CONFIRMED',
    note: 'Admin duyệt đơn hàng'
  }, {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue([200, 204].includes(res.status));
});
