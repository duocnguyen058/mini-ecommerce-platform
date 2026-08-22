Feature('Shipping - Address & Contact Validation @shipping @api');

Scenario('Kiểm tra hợp lệ địa chỉ giao hàng tự do và số điện thoại người nhận', async ({ I }) => {
  const authRes = await I.sendPostRequest('/api/auth/login', {
    username: 'customer',
    password: 'Passw0rd!'
  });
  const token = authRes.data.token || authRes.data.accessToken;

  // Add item
  await I.sendPostRequest('/api/cart/items', {
    productId: '908d15f9-ae16-45d8-8bc8-d5d139bb6348',
    sku: 'SKU-PHIL-1001',
    name: 'Nồi Chiên Không Dầu',
    price: 1500000,
    quantity: 1
  }, {
    Authorization: `Bearer ${token}`
  });

  // Valid long free-form address
  const res = await I.sendPostRequest('/api/checkout', {
    shippingAddress: {
      recipient: 'Trần Thị Thu Thảo',
      phone: '0912345678',
      streetLine: 'Số nhà 128/4/2, Hẻm 128, Đường Cách Mạng Tháng Tám, Phường 10, Quận 3, TP Hồ Chí Minh'
    },
    paymentMethod: 'COD'
  }, {
    Authorization: `Bearer ${token}`
  });

  I.assertTrue([200, 201, 202].includes(res.status));
});
