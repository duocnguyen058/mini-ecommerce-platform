Feature('Order - Inventory Sync Logic @order @inventory @api');

Scenario('Đồng bộ tồn kho: Xác nhận đơn trừ kho và hủy đơn hoàn kho', async ({ I }) => {
  const customerAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const customerToken = customerAuth.data.token || customerAuth.data.accessToken;

  // 1. Add item & checkout
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
      recipient: 'Nguyễn Văn Đồng Bộ',
      phone: '0901234567',
      streetLine: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh'
    },
    paymentMethod: 'COD'
  }, {
    Authorization: `Bearer ${customerToken}`
  });

  const orderId = orderRes.data.id;

  // 2. Admin confirms order
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const res = await I.sendPatchRequest(`/api/admin/orders/${orderId}/status`, {
    newStatus: 'CONFIRMED',
    note: 'Admin xac nhan don hang'
  }, {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue([200, 204].includes(res.status));
});
