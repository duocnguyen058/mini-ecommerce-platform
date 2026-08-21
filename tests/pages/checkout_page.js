const { I } = inject();

module.exports = {
  fields: {
    receiverName: 'input[placeholder*="Họ và tên"]',
    phoneNumber: 'input[placeholder*="Số điện thoại"]',
    addressDetail: 'input[placeholder*="Địa chỉ"], textarea',
    couponInput: 'input[placeholder*="mã giảm giá"]'
  },
  elements: {
    zaloPayOption: 'input[value="ZALOPAY"], label:has-text("ZaloPay")',
    codOption: 'input[value="COD"], label:has-text("COD")',
    applyCouponBtn: 'button:has-text("Áp dụng")',
    placeOrderBtn: 'button:has-text("Đặt hàng ngay"), button:has-text("Thanh toán")'
  },

  fillShippingAddress(name, phone, address) {
    I.fillField(this.fields.receiverName, name);
    I.fillField(this.fields.phoneNumber, phone);
    I.fillField(this.fields.addressDetail, address);
  },

  selectPaymentMethod(method) {
    if (method === 'ZALOPAY') {
      I.click(this.elements.zaloPayOption);
    } else {
      I.click(this.elements.codOption);
    }
  },

  applyCoupon(code) {
    I.fillField(this.fields.couponInput, code);
    I.click(this.elements.applyCouponBtn);
  },

  placeOrder() {
    I.click(this.elements.placeOrderBtn);
  }
};
