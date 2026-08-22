Feature('Admin - Coupons Management @admin @coupon @api');

Scenario('Admin tạo mới mã giảm giá thành công', async ({ I }) => {
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;

  const uniqueCode = `CODE_${Date.now()}`;
  const res = await I.sendPostRequest('/api/admin/coupons', {
    code: uniqueCode,
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderAmount: 500000,
    maxUsage: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue([200, 201].includes(res.status));
});
