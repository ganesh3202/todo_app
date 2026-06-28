const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Support both a full DATABASE_URL or individual vars
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log('SQL:', msg) : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME     || 'taskflow',
    process.env.DB_USER     || 'root',
    process.env.DB_PASSWORD || '',
    {
      host:    process.env.DB_HOST || 'localhost',
      port:    parseInt(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? (msg) => console.log('SQL:', msg) : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
    }
  );
}

module.exports = sequelize;
