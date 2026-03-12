import mysql from "mysql2/promise";

const isDev = process.env.NODE_ENV === "development";

function requireEnv(key: string, fallback?: string): string {
  const val = process.env[key] || fallback;
  if (!val) {
    throw new Error(`缺少必要的环境变量: ${key}，请检查 .env 文件`);
  }
  return val;
}

const pool = mysql.createPool({
  host: requireEnv("DB_HOST", isDev ? "localhost" : undefined),
  port: Number(requireEnv("DB_PORT", isDev ? "3306" : undefined)),
  user: requireEnv("DB_USER", isDev ? "app_roi_user" : undefined),
  password: requireEnv("DB_PASSWORD", isDev ? "app_roi_pass" : undefined),
  database: requireEnv("DB_NAME", isDev ? "app_roi" : undefined),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
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
