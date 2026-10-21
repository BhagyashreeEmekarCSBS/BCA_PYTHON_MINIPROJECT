const { Sequelize } = require('sequelize');
require('dotenv').config();

async function createDatabase() {
  // Connect without specifying a database
  const sequelize = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  });

  try {
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database "${process.env.DB_NAME}" created or already exists.`);
  } catch (error) {
    console.error('Error creating database:', error.message);
    console.log('\nPlease create the database manually:');
    console.log(`  CREATE DATABASE ${process.env.DB_NAME};`);
    console.log('\nOr update your .env file with correct MySQL credentials.');
  } finally {
    await sequelize.close();
  }
}

createDatabase();
