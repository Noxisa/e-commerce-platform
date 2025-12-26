const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Request = sequelize.define('Request', {
  furnitureType: { type: DataTypes.STRING, allowNull: false },
  woodType: { type: DataTypes.STRING, allowNull: false },
  dimensions: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT },
  userEmail: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  processedAt: { type: DataTypes.DATE, allowNull: true },
});

User.hasMany(Request);
Request.belongsTo(User);

module.exports = Request;
