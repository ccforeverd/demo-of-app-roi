# apps/express — CLAUDE.md

Express 后端 REST API 服务。

## Tech Stack

| 依赖 | 用途 |
|------|------|
| Express 5 | HTTP 框架 |
| mysql2 | MySQL 连接池（Promise API） |
| csv-parser | CSV 流式解析 |
| multer | 文件上传（multipart/form-data） |
| swagger-jsdoc + swagger-ui-express | API 文档生成与展示 |
| dotenv | 自动加载 `.env` 文件 |
| cors | CORS 中间件 |

## Commands

```bash
pnpm dev      # tsx watch src/index.ts（热重载）
pnpm build    # tsc -p tsconfig.build.json（输出到 dist/）
pnpm start    # node dist/index.js（生产启动）
pnpm clean    # 清理 dist/
```

## Environment Variables

文件：`.env`（从 `.env.example` 复制，`dotenv` 在 `src/index.ts` 顶部自动加载）

```env
NODE_ENV=development          # development 时 /clear 接口可用，production 时 403
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000  # CORS 白名单，多个地址逗号分隔
QUERY_LIMIT=50000             # 单次查询最大返回行数，默认 50000
MYSQL_ROOT_PASSWORD=root123   # Docker Compose MySQL root 密码
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_roi_user
DB_PASSWORD=app_roi_pass
DB_NAME=app_roi
```

> 生产环境中 `DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME` 为必填项，缺失时服务拒绝启动（`requireEnv()` 抛错）。

## Source Structure

```
src/
├── index.ts              # 入口：dotenv 加载、Express 初始化、CORS、路由挂载
├── swagger.ts            # swagger-jsdoc 配置
├── db/
│   ├── pool.ts           # MySQL 连接池，requireEnv() 强制要求生产环境配置
│   └── schema.sql        # 建表 SQL（Docker 初始化时自动执行）
├── routes/
│   └── roi.routes.ts     # 所有 /api/roi/* 路由，含 devOnly 中间件与输入校验
└── services/
    ├── roi.service.ts    # 数据查询、线性预测、清空操作
    └── import.service.ts # CSV 解析与入库逻辑
```

## API Endpoints

基础路径：`/api/roi`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/roi/filters` | 获取筛选器选项（app、country、bid_type、install_channel、date_range） |
| GET | `/api/roi/data` | 查询 ROI 数据，支持筛选与线性预测 |
| POST | `/api/roi/import` | 上传 CSV 文件并导入数据（multipart/form-data，字段名 `file`） |
| DELETE | `/api/roi/clear` | 清空所有数据（**仅 `NODE_ENV=development`**，否则 403） |
| GET | `/api-docs` | Swagger UI 文档 |
| GET | `/api/health` | 健康检查 |

### GET /api/roi/data 查询参数校验

| 参数 | 格式校验 | 说明 |
|------|---------|------|
| `app`, `country`, `bid_type`, `install_channel` | 最大 100 字符 | 不合法返回 400 |
| `start_date`, `end_date` | `YYYY-MM-DD` | 不合法返回 400 |
| `predict` | `"true"` | 启用线性外推预测 |

## Security

| 措施 | 实现 |
|------|------|
| **CORS 白名单** | `index.ts`：按 `ALLOWED_ORIGINS` 校验 origin，不在白名单返回 CORS 错误 |
| **输入校验** | `roi.routes.ts` `validateQueryParams()`：日期格式 + 字符串长度 |
| **查询限制** | `roi.service.ts` `queryRoiData()`：`LIMIT ${QUERY_LIMIT}`，默认 50000 |
| **错误脱敏** | `roi.routes.ts` `safeErrorMsg()`：production 返回"内部服务器错误"，细节仅 `console.error` |
| **Dev-only 接口** | `roi.routes.ts` `devOnly` 中间件：非 development 返回 403 |
| **DB 凭据强制** | `db/pool.ts` `requireEnv()`：生产环境缺少 DB 配置时启动失败 |
| **连接池上限** | `db/pool.ts`：`queueLimit=100`，防止连接请求无限堆积 |
| **JSON body 限制** | `index.ts`：`express.json({ limit: "1mb" })` |

## Key Implementation Notes

- CSV 导入使用流式解析，临时文件在 `finally` 块中通过 `fs.unlink` 清理
- 线性预测在 `roi.service.ts` `applyLinearPrediction()` 中实现，基于最近 14 个真实数据点做线性回归
- `NULL` vs `0` 区分逻辑在 `import.service.ts` 中，依据 `install_count` 与日期判断
- 唯一索引 `(date, app, bid_type, country, install_channel)` 保证重复导入不会产生重复数据
