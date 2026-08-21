module.exports = {
  adminUser: {
    email: 'admin@miniecommerce.com',
    password: 'AdminPassword123!',
    role: 'ROLE_ADMIN'
  },
  standardCustomer: {
    email: 'customer@miniecommerce.com',
    password: 'CustomerPassword123!',
    role: 'ROLE_CUSTOMER'
  },
  newCustomer: {
    email: `auto_${Date.now()}@miniecommerce.com`,
    password: 'SecurePassword123!',
    fullName: 'Nguyễn Văn Kiểm Thử'
  }
};
