const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ALLOWED_CATEGORIES = ['chair', 'table', 'cabinet', 'bed', 'shelf'];
const ALLOWED_WOODS = ['oak', 'pine', 'walnut', 'cherry', 'maple'];

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },

  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isIn: [ALLOWED_CATEGORIES] },
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true },
  },

  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      isPositive(value) {
        if (Number(value) <= 0) throw new Error('basePrice must be a positive number');
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
        for (const w of list) {
          if (!ALLOWED_WOODS.includes(w)) throw new Error(`Invalid wood type: ${w}`);
        }
      },
    },
  },

  variants: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isVariantArray(value) {
        if (!Array.isArray(value)) throw new Error('variants must be an array');
        for (const v of value) {
          if (typeof v !== 'object' || v === null) throw new Error('each variant must be an object');
          if (!('name' in v)) throw new Error('each variant must have a name');
          if (!('priceModifier' in v)) throw new Error('each variant must have a priceModifier');
          const num = Number(v.priceModifier);
          if (Number.isNaN(num)) throw new Error('priceModifier must be numeric');
        }
      },
    },
  },

  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'Products',
  timestamps: true,
});

module.exports = Product;
