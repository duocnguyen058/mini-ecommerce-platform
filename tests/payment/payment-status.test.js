Feature('Payment - Payment Status Lookup @payment @zalopay @api');

Scenario('Kiểm tra trạng thái thanh toán của đơn hàng', async ({ I }) => {
  const res = await I.sendGetRequest('/api/payment/orders/d0000000-0000-0000-0000-000000000001');
  I.assertTrue(res.status >= 200 && res.status < 500);
});
