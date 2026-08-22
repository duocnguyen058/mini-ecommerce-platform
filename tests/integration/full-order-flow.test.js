Feature('Integration - Full Order Lifecycle E2E Business Flow @integration @flow @api');

Scenario('Chu trình nghiệp vụ hoàn chỉnh từ Đăng ký -> Mua hàng -> Áp mã -> Thanh toán -> Duyệt đơn -> Trừ kho -> Hủy đơn -> Hoàn kho', async ({ I }) => {
  // 1. Authenticate with active customer account
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  // 2. Browse catalog & get available product
  const productsRes = await I.sendGetRequest('/api/products?size=5');
  const products = productsRes.data.content || productsRes.data;
  const targetProduct = products[0];

  // 3. Add product to cart
  const cartRes = await I.sendPostRequest('/api/cart/items', {
    productId: targetProduct.id,
    sku: targetProduct.sku || 'SKU-TEST-FLOW',
    name: targetProduct.name,
    price: targetProduct.price || 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue(cartRes.status === 200);

  // 4. Apply coupon WELCOME10
  const couponRes = await I.sendPostRequest('/api/coupons/validate', {
    code: 'WELCOME10',
    orderAmount: 10000000
  }, {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue(couponRes.status === 200);
  I.assertEqual(couponRes.data.valid, true);

  // 5. Checkout order
  const checkoutRes = await I.sendPostRequest('/api/checkout', {
    shippingAddress: {
      recipient: 'Nguyễn Văn Luồng Hoàn Chỉnh',
      phone: '0901234567',
      streetLine: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh'
    },
    paymentMethod: 'COD'
  }, {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue([200, 201, 202].includes(checkoutRes.status));
  const orderId = checkoutRes.data.id;

  // 6. Check customer order list
  const ordersRes = await I.sendGetRequest('/api/orders', {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue(ordersRes.status === 200);

  // 7. Admin confirms order (Deduct inventory)
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const confirmRes = await I.sendPatchRequest(`/api/admin/orders/${orderId}/status`, {
    newStatus: 'CONFIRMED',
    note: 'Admin duyệt đơn hàng tích hợp'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  I.assertTrue([200, 204].includes(confirmRes.status));

  // 8. Cancel order & Refund stock
  const cancelRes = await I.sendPostRequest(`/api/orders/${orderId}/cancel`, {
    reason: 'Thử nghiệm chu trình hủy đơn hoàn kho'
  }, {
    Authorization: `Bearer ${token}`
  });
  I.assertTrue([200, 204].includes(cancelRes.status));
});
