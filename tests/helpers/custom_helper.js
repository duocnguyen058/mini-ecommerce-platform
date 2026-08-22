const Helper = require('@codeceptjs/helper');
const { expect } = require('chai');
const crypto = require('crypto');
const axios = require('axios');

class CustomHelper extends Helper {
  // Assertions
  assertTrue(val, msg) {
    expect(val, msg).to.be.true;
  }

  assertEqual(actual, expected, msg) {
    expect(actual, msg).to.equal(expected);
  }

  seeResponseCodeIs(code) {
    const rest = this.helpers['REST'];
    if (rest && rest.response) {
      expect(rest.response.status).to.equal(code);
    }
  }

  seeResponseCodeIsSuccessful() {
    const rest = this.helpers['REST'];
    if (rest && rest.response) {
      expect(rest.response.status).to.be.within(200, 299);
    }
  }

  seeResponseContainsJson(expectedJson) {
    const rest = this.helpers['REST'];
    if (rest && rest.response && rest.response.data) {
      for (const [key, val] of Object.entries(expectedJson)) {
        if (typeof val === 'object' && val !== null) {
          expect(rest.response.data[key]).to.deep.include(val);
        } else {
          expect(rest.response.data[key]).to.equal(val);
        }
      }
    }
  }

  // Generate ZaloPay Sandbox Signature
  generateZaloPayMac(key, data) {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  // Create random test email
  generateRandomEmail() {
    return `test_user_${Date.now()}_${Math.floor(Math.random() * 1000)}@ecommerce.vn`;
  }

  // Wait for network idle
  async waitForNetworkIdle(timeout = 5000) {
    const page = this.helpers['Playwright']?.page;
    if (page) {
      await page.waitForLoadState('networkidle', { timeout });
    }
  }

  // Set Auth token, user object & default address in browser localStorage
  async authenticateSession(username = 'customer', password = 'Passw0rd!') {
    const page = this.helpers['Playwright']?.page;
    if (!page) return;

    try {
      const apiUrl = process.env.API_GATEWAY_URL || 'http://localhost:8080';
      const res = await axios.post(`${apiUrl}/api/auth/login`, { username, password });
      const { token, ...userData } = res.data;

      const defaultAddr = [{
        id: 'addr_default_1',
        recipient: 'Nguyễn Văn Khách Hàng',
        phone: '0901234567',
        streetLine: '123 Đường Lê Lợi',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        country: 'VN',
        isDefault: true
      }];

      await page.goto(process.env.APP_URL || 'http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ token, userData, defaultAddr }) => {
        localStorage.setItem('mini_ecommerce_token', token);
        localStorage.setItem('mini_ecommerce_user', JSON.stringify(userData));
        localStorage.setItem('mini_ecommerce_addresses', JSON.stringify(defaultAddr));
      }, { token, userData, defaultAddr });
    } catch (err) {
      console.warn('authenticateSession error:', err.message);
    }
  }
}

module.exports = CustomHelper;
