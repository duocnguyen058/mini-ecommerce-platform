Feature('Inventory - Stock Lookup @inventory @api');

Scenario('Kiểm tra tồn kho của sản phẩm có sẵn', async ({ I }) => {
  const res = await I.sendGetRequest('/api/inventory/908d15f9-ae16-45d8-8bc8-d5d139bb6348');
  I.assertTrue(res.status === 200);
  I.assertTrue(typeof res.data.quantityOnHand === 'number');
  I.assertTrue(typeof res.data.availableQuantity === 'number');
});
