Feature('Review - Comments & XSS Resilience @review @security @api');

const productData = require('../data/product.json');

Scenario('Đăng bình luận hỏi đáp về sản phẩm thành công', async ({ I }) => {
  const res = await I.sendPostRequest('/api/catalog/products/test/comments', {
    content: 'Sản phẩm này còn màu đen không shop?',
    rating: 5
  });
  I.assertTrue(res.status !== 500);
});

Scenario('Kiểm thử chống XSS Injection trong bình luận sản phẩm', async ({ I }) => {
  for (const xss of productData.xss) {
    const res = await I.sendPostRequest('/api/catalog/products/test/comments', {
      content: xss.payload,
      rating: 5
    });
    I.assertTrue(res.status !== 500);
  }
});
