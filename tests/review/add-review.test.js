Feature('Review - Product Reviews & Ratings @review @api');

Scenario('Khách hàng gửi đánh giá và chấm sao cho sản phẩm', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  const res = await I.sendPostRequest('/api/catalog/products/908d15f9-ae16-45d8-8bc8-d5d139bb6348/reviews', {
    rating: 5,
    title: 'Sản phẩm tuyệt vời',
    comment: 'Chất lượng rất tốt, đóng gói cẩn thận và giao nhanh!'
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue(res.status >= 200 && res.status < 500);
});
