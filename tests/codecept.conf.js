const { setHeadlessWhen, setCommonPlugins } = require('@codeceptjs/configure');

const isHeadless = process.env.HEADLESS === 'true';
// 600ms slowMo by default for natural human cadence in headed mode
const slowMo = process.env.SLOWMO ? parseInt(process.env.SLOWMO, 10) : (!isHeadless ? 600 : 0);

setHeadlessWhen(isHeadless);
setCommonPlugins();

exports.config = {
  tests: process.env.TEST_FILE || [
    './auth/*.test.js',
    './catalog/*.test.js',
    './inventory/*.test.js',
    './cart/*.test.js',
    './order/*.test.js',
    './payment/*.test.js',
    './review/*.test.js',
    './notification/*.test.js',
    './shipping/*.test.js',
    './user/*.test.js',
    './admin/*.test.js',
    './integration/*.test.js',
    './e2e/*.test.js',
    './ui/*.ui.test.js'
  ],
  output: './output',
  helpers: {
    Playwright: {
      url: process.env.APP_URL || 'http://localhost:3000',
      show: !isHeadless,
      browser: 'chromium',
      waitForTimeout: 15000,
      waitForNavigation: 'load',
      windowSize: '1280x800',
      restart: 'keep',
      keepBrowserState: true,
      keepCookies: true,
      chromium: {
        args: [
          '--window-size=1280,800',
          '--window-position=120,60',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        slowMo: slowMo
      }
    },
    REST: {
      endpoint: process.env.API_GATEWAY_URL || 'http://localhost:8080',
      onRequest: (request) => {
        request.headers = {
          ...request.headers,
          'Content-Type': 'application/json'
        };
      }
    },
    CustomHelper: {
      require: './helpers/custom_helper.js'
    }
  },
  include: {
    I: './steps/steps_file.js',
    loginPage: './pages/login_page.js',
    productPage: './pages/product_page.js',
    cartPage: './pages/cart_page.js',
    checkoutPage: './pages/checkout_page.js',
    adminPage: './pages/admin_page.js'
  },
  plugins: {
    screenshotOnFail: {
      enabled: true
    },
    retryFailedStep: {
      enabled: true,
      retries: 2
    }
  },
  name: 'mini-ecommerce-platform-tests'
};
