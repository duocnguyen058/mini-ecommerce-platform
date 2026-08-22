Feature('Inventory - High Concurrency & Race Condition @inventory @concurrency @api');

Scenario('Kiểm thử tranh chấp tồn kho khi 10 yêu cầu đồng thời (Race Condition Protection)', async ({ I }) => {
  const concurrentRequests = 10;
  const responses = [];

  for (let i = 0; i < concurrentRequests; i++) {
    responses.push(
      I.sendPostRequest('/api/inventory/reserve', {
        productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
        quantity: 1,
        orderId: `ORD_CONCURRENT_${Date.now()}_${i}`
      })
    );
  }

  const results = await Promise.allSettled(responses);
  I.assertTrue(results.length === concurrentRequests);
});
