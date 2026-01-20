const {Sequelize} = require('sequelize');
// dotenv is loaded by app.js in non-test environments. Avoid loading here to prevent test-time overrides.
if (process.env.NODE_ENV !== 'test') {
    require('dotenv').config();
}

let sequelize;
if (process.env.NODE_ENV === 'test') {
    // Use in-memory sqlite for tests to avoid external DB dependencies
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASS,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'postgres',
            logging: false,
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        }
    );
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({alter: true});
        console.log('Database connected and synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = {sequelize, connectDB};