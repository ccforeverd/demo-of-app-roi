import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "app_roi_user",
  password: process.env.DB_PASSWORD || "app_roi_pass",
  database: process.env.DB_NAME || "app_roi",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log("MySQL 连接成功");
  } finally {
    conn.release();
  }
}

export default pool;
