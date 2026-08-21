const { I } = inject();

module.exports = {
  fields: {
    username: 'input#username',
    password: 'input[type="password"]'
  },
  submitButton: 'button[type="submit"]',
  errorMessage: '.text-destructive, .error-message',

  login(username, password) {
    I.amOnPage('/login');
    I.fillField(this.fields.username, username);
    I.fillField(this.fields.password, password);
    I.click(this.submitButton);
  },

  seeLoginError(message) {
    I.see(message, this.errorMessage);
  }
};
