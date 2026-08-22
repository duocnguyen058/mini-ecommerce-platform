Feature('Notification - Customer Order Notifications @notification @api');

Scenario('Khách hàng xem danh sách thông báo đơn hàng của mình', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;
  const userId = authRes.data.userId || authRes.data.user?.id || 'b0000000-0000-0000-0000-000000000002';

  const res = await I.sendGetRequest(`/api/notifications/user/${userId}`, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue(res.status === 200);
  I.assertTrue(Array.isArray(res.data.content || res.data));
});

Scenario('Đánh dấu tất cả thông báo là đã đọc', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;
  const userId = authRes.data.userId || authRes.data.user?.id || 'b0000000-0000-0000-0000-000000000002';

  const res = await I.sendPatchRequest(`/api/notifications/user/${userId}/read-all`, {}, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue([200, 204].includes(res.status));
});
