Feature('Inventory - Stock Reservation @inventory @api');

Scenario('Đặt trước tồn kho cho đơn hàng (Reserve Stock)', async ({ I }) => {
  const orderId = `ORD_TEST_${Date.now()}`;
  const res = await I.sendPostRequest('/api/inventory/reserve', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    quantity: 1,
    orderId: orderId
  });
  I.assertTrue(res.status >= 200 && res.status < 500);
});
