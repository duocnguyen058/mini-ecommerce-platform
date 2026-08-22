Feature('Auth - Registration & Validation @auth @api');

Scenario('Đăng ký tài khoản mới thành công (Positive Test)', async ({ I }) => {
  const uniqueUser = `user_${Date.now()}`;
  const res = await I.sendPostRequest('/api/auth/register', {
    username: uniqueUser,
    email: `${uniqueUser}@ecommerce.vn`,
    password: 'Passw0rd!',
    fullName: 'Nguyễn Văn Kiểm Thử'
  });
  I.assertTrue([200, 201].includes(res.status));
});

Scenario('Đăng ký thất bại khi Họ và Tên chỉ có 1 từ (Validation Test)', async ({ I }) => {
  const uniqueUser = `invalid_${Date.now()}`;
  const res = await I.sendPostRequest('/api/auth/register', {
    username: uniqueUser,
    email: `${uniqueUser}@ecommerce.vn`,
    password: 'Passw0rd!',
    fullName: 'Nam' // Chỉ 1 từ -> không hợp lệ
  });
  I.assertTrue([400, 422].includes(res.status));
});

Scenario('Đăng ký thất bại khi trùng tên đăng nhập (Conflict Test)', async ({ I }) => {
  const res = await I.sendPostRequest('/api/auth/register', {
    username: 'customer', // Đã tồn tại
    email: `unique_${Date.now()}@ecommerce.vn`,
    password: 'Passw0rd!',
    fullName: 'Nguyễn Văn Trùng'
  });
  I.assertTrue([400, 409].includes(res.status));
});
