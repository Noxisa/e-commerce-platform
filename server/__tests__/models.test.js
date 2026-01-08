const { Sequelize, DataTypes } = require('sequelize');

describe('Model validations (User & Product) using sqlite in-memory', () => {
  let sequelize;
  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });

    // define User model (copy of server/models/User.js logic simplified)
    const User = sequelize.define('User', {
      email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
      password: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'customer', validate: { isIn: [['customer','admin']] } },
    });

    // Define Product (match relevant validations)
    const Product = sequelize.define('Product', {
      name: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false, validate: { isIn: [['chair','table','cabinet','bed','shelf']] } },
      description: { type: DataTypes.TEXT, allowNull: false },
      basePrice: { type: DataTypes.DECIMAL(10,2), allowNull: false, validate: { isDecimal: true, minValue(v) { if (Number(v) <= 0) throw new Error('basePrice must be positive'); } } },
      availableWoodTypes: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      variants: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    });

    await sequelize.sync({ force: true });
    // attach to this context
    global.TestModels = { sequelize, User, Product };
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('User validation rejects invalid email', async () => {
    const { User } = global.TestModels;
    await expect(User.create({ email: 'not-an-email', password: 'x' })).rejects.toThrow();
  });

  test('Product rejects negative basePrice and invalid category', async () => {
    const { Product } = global.TestModels;
    await expect(Product.create({ name: 'A', category: 'invalid', description: 'd', basePrice: '100' })).rejects.toThrow();
    await expect(Product.create({ name: 'A', category: 'chair', description: 'd', basePrice: '-1' })).rejects.toThrow();
  });
});
