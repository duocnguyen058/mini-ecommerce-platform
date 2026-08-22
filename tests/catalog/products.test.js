Feature('Catalog - Product Details & Variants @catalog @api');

Scenario('Lấy danh sách sản phẩm phân trang thành công', async ({ I }) => {
  const res = await I.sendGetRequest('/api/products?page=0&size=10');
  I.assertTrue(res.status === 200);
  I.assertTrue(Array.isArray(res.data.content || res.data));
  I.assertTrue((res.data.content || res.data).length > 0);
});

Scenario('Lấy chi tiết sản phẩm theo ID hợp lệ', async ({ I }) => {
  const listRes = await I.sendGetRequest('/api/products?size=1');
  const items = listRes.data.content || listRes.data;
  const productId = items[0].id;

  const res = await I.sendGetRequest(`/api/products/${productId}`);
  I.assertTrue(res.status === 200);
  I.assertEqual(res.data.id, productId);
  I.assertTrue(typeof res.data.name === 'string');
  I.assertTrue(res.data.price > 0);
});

Scenario('Trả về 404 khi truy vấn sản phẩm không tồn tại', async ({ I }) => {
  const res = await I.sendGetRequest('/api/products/00000000-0000-0000-0000-000000000000');
  I.assertTrue(res.status === 404);
});
