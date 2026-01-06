const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ALLOWED_WOOD = ['oak', 'pine', 'walnut', 'cherry', 'maple'];
const ALLOWED_CATEGORIES = ['chair', 'table', 'cabinet', 'bed', 'shelf'];

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isIn: [ALLOWED_CATEGORIES] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      minValue(value) {
        if (Number(value) <= 0) {
          throw new Error('basePrice must be a positive number');
        }
      },
    },
  },
  availableWoodTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    validate: {
      isAllowed(list) {
        if (!Array.isArray(list)) throw new Error('availableWoodTypes must be an array');
        const invalid = list.filter((w) => !ALLOWED_WOOD.includes(w));
        if (invalid.length) throw new Error(`Invalid wood types: ${invalid.join(', ')}`);
      },
    },
  },
  variants: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isArrayOfVariants(value) {
        if (!Array.isArray(value)) throw new Error('variants must be an array');
        value.forEach((v) => {
          if (typeof v !== 'object' || v === null) throw new Error('each variant must be an object');
          if (!('name' in v)) throw new Error('variant missing name');
          if (!('priceModifier' in v)) throw new Error('variant missing priceModifier');
          const num = Number(v.priceModifier);
          if (Number.isNaN(num)) throw new Error('variant priceModifier must be a number');
        });
      },
    },
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

module.exports = Product;
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
