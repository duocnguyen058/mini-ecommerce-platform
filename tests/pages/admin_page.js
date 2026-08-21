const { I } = inject();

module.exports = {
  elements: {
    dashboardTitle: 'h1:has-text("Admin"), h1:has-text("Quản trị")',
    orderStatusSelect: 'select[name="orderStatus"]',
    updateStatusBtn: 'button:has-text("Cập nhật trạng thái")',
    productTable: '.admin-products-table',
    inventoryCountInput: 'input[name="stockQuantity"]'
  },

  openDashboard() {
    I.amOnPage('/admin');
  },

  updateOrderStatus(orderId, newStatus) {
    I.amOnPage(`/admin/orders/${orderId}`);
    I.selectOption(this.elements.orderStatusSelect, newStatus);
    I.click(this.elements.updateStatusBtn);
  }
};
