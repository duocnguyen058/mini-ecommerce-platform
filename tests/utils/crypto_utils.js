const crypto = require('crypto');

module.exports = {
  hmacSha256(key, data) {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  },
  randomUUID() {
    return crypto.randomUUID();
  },
  randomString(length = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
  }
};
