import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import roiRoutes from "./routes/roi.routes";
import { testConnection } from "./db/pool";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Swagger 文档
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API 路由
app.use("/api/roi", roiRoutes);

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, async () => {
  console.log(`Express 监听 http://localhost:${port}`);
  console.log(`Swagger 文档 http://localhost:${port}/api-docs`);
  try {
    await testConnection();
  } catch (err) {
    console.error("MySQL 连接失败:", err);
  }
});
