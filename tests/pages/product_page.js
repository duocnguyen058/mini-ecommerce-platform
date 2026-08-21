const { I } = inject();

module.exports = {
  elements: {
    productTitle: 'h1',
    priceTag: '.text-3xl.font-bold, .product-price',
    addToCartBtn: 'button:has-text("Thêm vào giỏ")',
    buyNowBtn: 'button:has-text("Mua ngay")',
    specificationsTable: 'table, .specs-container',
    reviewList: '.reviews-section, .product-reviews'
  },

  openProduct(slug) {
    I.amOnPage(`/products/${slug}`);
  },

  selectVariant(variantName) {
    I.click(`button:has-text("${variantName}")`);
  },

  addToCart() {
    I.click(this.elements.addToCartBtn);
  }
};
