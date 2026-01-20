const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');

const Request = sequelize.define('Request', {
  furnitureType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  woodType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id',
    },
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  selectedVariants: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  preferredDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'contacted', 'in_progress', 'completed', 'cancelled']],
    },
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Relations
User.hasMany(Request);
Request.belongsTo(User);

Product.hasMany(Request);
Request.belongsTo(Product);

module.exports = Request;
