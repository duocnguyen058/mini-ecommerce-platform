const { I } = inject();

module.exports = {
  elements: {
    cartItem: '.cart-item-row',
    itemQuantity: 'input[type="number"]',
    removeBtn: 'button:has-text("Xoá")',
    totalPrice: '.cart-total-price',
    checkoutBtn: 'button:has-text("Tiến hành thanh toán"), a[href="/checkout"]'
  },

  openCart() {
    I.amOnPage('/cart');
  },

  updateQuantity(newQty) {
    I.fillField(this.elements.itemQuantity, newQty);
  },

  proceedToCheckout() {
    I.click(this.elements.checkoutBtn);
  }
};
