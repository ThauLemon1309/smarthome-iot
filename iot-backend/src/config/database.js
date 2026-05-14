const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'DADN',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE || 'SQLEXPRESS',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      console.log('✅ Kết nối SQL Server thành công!');
    } catch (err) {
      console.error('❌ Lỗi kết nối SQL Server:', err.message);
      throw err;
    }
  }
  return pool;
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('⏹️ Đã đóng kết nối SQL Server');
  }
}

module.exports = { sql, getPool, closePool, dbConfig };
