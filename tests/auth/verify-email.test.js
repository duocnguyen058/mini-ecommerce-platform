Feature('Auth - Email Verification @auth @api');

Scenario('Yêu cầu gửi lại email xác thực (Resend Verification API)', async ({ I }) => {
  const res = await I.sendPostRequest('/api/auth/resend-verification?email=customer%40ecommerce.vn', {});
  I.assertTrue(res.status >= 200 && res.status < 500);
});

Scenario('Xác thực email với token không hợp lệ (Negative Verification)', async ({ I }) => {
  const res = await I.sendGetRequest('/api/auth/verify-email?token=invalid_dummy_token_12345');
  I.assertTrue([400, 404, 422].includes(res.status));
});
