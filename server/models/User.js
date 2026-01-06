const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'customer',
    validate: { isIn: [['customer', 'admin']] },
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  adminPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      if (user.adminPassword) {
        user.adminPassword = await bcrypt.hash(user.adminPassword, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      if (user.changed('adminPassword')) {
        user.adminPassword = await bcrypt.hash(user.adminPassword, 10);
      }
    },
  },
});

// Instance method to compare regular password
User.prototype.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Instance method to verify admin credentials: requires both regular password and adminPassword
User.prototype.verifyAdminCredentials = async function (plainPassword, plainAdminPassword) {
  if (this.role !== 'admin') return false;
  const regularOk = await bcrypt.compare(plainPassword, this.password);
  if (!regularOk) return false;
  if (!this.adminPassword) return false;
  const adminOk = await bcrypt.compare(plainAdminPassword, this.adminPassword);
  return regularOk && adminOk;
};

module.exports = User;