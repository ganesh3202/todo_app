require('dotenv').config();
const sequelize = require('./database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection SUCCESS');
    console.log('   Host:', process.env.DB_HOST || 'localhost');
    console.log('   DB  :', process.env.DB_NAME || 'taskflow');
    process.exit(0);
  } catch (err) {
    console.error('❌ MySQL connection FAILED:', err.message);
    console.log('');
    console.log('Checklist:');
    console.log('  1. Is MySQL running?  →  mysql.server start  OR  brew services start mysql');
    console.log('  2. Is the DB created? →  CREATE DATABASE taskflow;');
    console.log('  3. Are DB_USER / DB_PASSWORD correct in backend/.env?');
    process.exit(1);
  }
}

testConnection();
