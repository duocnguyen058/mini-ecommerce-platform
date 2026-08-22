module.exports = function() {
  return actor({
    /**
     * Mở trang web và đợi DOM sẵn sàng với nhịp điệu người dùng thực
     */
    openPage(url) {
      this.amOnPage(url);
      this.wait(1.5);
    },

    /**
     * Điền dữ liệu tự nhiên như người dùng thật (có xóa dữ liệu cũ và gõ từng ký tự)
     */
    clearAndFillField(selector, value) {
      this.waitForElement(selector, 10);
      this.click(selector);
      this.pressKey(['Control', 'a']);
      this.pressKey(['Meta', 'a']);
      this.pressKey('Backspace');
      this.fillField(selector, value);
      this.wait(0.4);
    },

    /**
     * Click an toàn: Đợi element hiển thị, có thể tương tác trước khi click
     */
    safeClick(selector) {
      this.waitForElement(selector, 10);
      this.waitForVisible(selector, 10);
      this.click(selector);
      this.wait(1.5);
    },

    /**
     * Đăng nhập trực quan 100% trên form (gõ phím, click submit và đồng bộ session)
     */
    login(username = 'customer', password = 'Passw0rd!') {
      this.amOnPage('/login');
      this.waitForElement('input#username', 10);
      this.wait(1.2);
      this.clearAndFillField('input#username', username);
      this.wait(0.6);
      this.clearAndFillField('input[type="password"]', password);
      this.wait(0.6);
      this.click('form button[type="submit"]');
      this.wait(2.5);
      this.authenticateSession(username, password);
      this.wait(1);
    }
  });
};
