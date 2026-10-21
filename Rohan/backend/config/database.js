const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine whether SSL should be enabled (required for Aiven and cloud MySQL, or when DB_SSL=true)
const isLocal = ['localhost', '127.0.0.1', 'mysql'].includes(process.env.DB_HOST);
const dialectOptions = (process.env.DB_SSL === 'true' || (!isLocal && process.env.DB_SSL !== 'false'))
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : {};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
