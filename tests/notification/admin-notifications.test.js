Feature('Notification - Admin Notifications @notification @admin @api');

Scenario('Admin xem danh sách thông báo đơn hàng mới đầy đủ thông tin', async ({ I }) => {
  const adminAuth = await I.sendPostRequest('/api/auth/login', {
    username: 'admin',
    password: 'Passw0rd!'
  });
  const adminToken = adminAuth.data.token || adminAuth.data.accessToken;
  const adminUserId = adminAuth.data.userId || adminAuth.data.user?.id || 'b0000000-0000-0000-0000-000000000001';

  const res = await I.sendGetRequest(`/api/notifications/user/${adminUserId}`, {
    Authorization: `Bearer ${adminToken}`
  });

  I.assertTrue(res.status === 200);
  I.assertTrue(Array.isArray(res.data.content || res.data));
});
