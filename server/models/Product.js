const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Product model with flexible variants and wood types
const Product = sequelize.define('Product', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  // Supported wood types for this product (stored as JSON array)
  woodTypes: { type: DataTypes.JSON, allowNull: true },
  // Variants example: [{ id: 'small', label: 'Small', sku: 'S-001', price: 250.00 }]
  variants: { type: DataTypes.JSON, allowNull: true },
  // Base price (optional) and price metadata
  basePrice: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  // images: array of image urls
  images: { type: DataTypes.JSON, allowNull: true },
  // Active flag
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

module.exports = Product;
