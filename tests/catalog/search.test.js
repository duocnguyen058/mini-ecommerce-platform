Feature('Catalog - Search & Filtering @catalog @api');

Scenario('Tìm kiếm sản phẩm theo từ khóa thương hiệu', async ({ I }) => {
  const res = await I.sendGetRequest('/api/products?q=Apple');
  I.assertTrue(res.status === 200);
  const items = res.data.content || res.data;
  I.assertTrue(Array.isArray(items));
});

Scenario('Lọc sản phẩm theo khoảng giá và sắp xếp', async ({ I }) => {
  const res = await I.sendGetRequest('/api/products?maxPrice=15000000&sort=price,asc');
  I.assertTrue(res.status === 200);
  const items = res.data.content || res.data;
  I.assertTrue(Array.isArray(items));
});

Scenario('Tìm kiếm sản phẩm với tiếng Việt Unicode có dấu', async ({ I }) => {
  const queries = ['Điện thoại thông minh', 'Tai nghe chống ồn', 'Tủ lạnh'];
  for (const q of queries) {
    const res = await I.sendGetRequest(`/api/products?q=${encodeURIComponent(q)}`);
    I.assertTrue(res.status === 200);
  }
});
