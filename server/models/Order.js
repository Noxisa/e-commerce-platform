const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Order = sequelize.define('Order', {
  furnitureType: { type: DataTypes.STRING, allowNull: false },
  woodType: { type: DataTypes.STRING, allowNull: false },
  dimensions: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT },
  userEmail: { type: DataTypes.STRING, allowNull: false },
});

// Relacja
User.hasMany(Order);
Order.belongsTo(User);

module.exports = Order;