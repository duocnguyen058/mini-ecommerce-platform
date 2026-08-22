Feature('Payment - ZaloPay Webhook Callback @payment @zalopay @api');

const cryptoUtils = require('../utils/crypto_utils');

const ZALOPAY_APP_ID = 2553;
const ZALOPAY_KEY2 = 'kLtgPl8YESDmyABkQgeZByOUJsbcpNI2';

Scenario('Xác thực Webhook Callback Signature hợp lệ từ ZaloPay (HMAC-SHA256)', async ({ I }) => {
  const sampleData = JSON.stringify({
    app_id: ZALOPAY_APP_ID,
    app_trans_id: `260815_${Date.now().toString().substring(5)}`,
    zp_trans_id: '260815000099',
    status: 1
  });
  const validMac = cryptoUtils.hmacSha256(ZALOPAY_KEY2, sampleData);

  const res = await I.sendPostRequest('/api/payment/zalopay/callback', {
    data: sampleData,
    mac: validMac
  });

  I.assertTrue(res.status === 200);
  I.assertEqual(res.data.return_code, 1);
  I.assertEqual(res.data.return_message, 'ok');
});

Scenario('Từ chối Webhook Callback khi sai chữ ký HMAC Signature (Tampering Protection)', async ({ I }) => {
  const sampleData = JSON.stringify({
    app_id: ZALOPAY_APP_ID,
    app_trans_id: 'fake_trans_123',
    status: 1
  });
  const invalidMac = 'tampered_fake_signature_hash';

  const res = await I.sendPostRequest('/api/payment/zalopay/callback', {
    data: sampleData,
    mac: invalidMac
  });

  I.assertTrue(res.status === 200);
  I.assertEqual(res.data.return_code, -1);
  I.assertEqual(res.data.return_message, 'mac not equal');
});
