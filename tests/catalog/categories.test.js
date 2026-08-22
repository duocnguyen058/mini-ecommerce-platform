Feature('Catalog - Categories Hierarchy @catalog @api');

Scenario('Lấy danh sách toàn bộ danh mục cây phân cấp', async ({ I }) => {
  const res = await I.sendGetRequest('/api/categories');
  I.assertTrue(res.status === 200);
  I.assertTrue(Array.isArray(res.data));
  I.assertTrue(res.data.length > 0);
  I.assertTrue(res.data.some(cat => typeof cat.name === 'string' && cat.name.length > 0));
});
