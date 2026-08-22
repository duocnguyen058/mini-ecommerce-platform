Feature('Catalog - Brand Management @catalog @api');

Scenario('Lấy danh sách 28 thương hiệu chính hãng', async ({ I }) => {
  const res = await I.sendGetRequest('/api/v1/brands');
  I.assertTrue(res.status === 200);
  I.assertTrue(Array.isArray(res.data));
  I.assertTrue(res.data.length >= 10);
  I.assertTrue(res.data.some(b => b.name === 'Apple' || b.name === 'Samsung'));
});
