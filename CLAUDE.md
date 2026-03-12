# CLAUDE.md

## Project Overview

App ROI Dashboard - 应用投资回报率趋势数据看板系统。TypeScript monorepo, pnpm workspaces。

## Architecture

- **packages/shared** - 公共类型和常量 (前后端共用)
- **apps/express** - 后端 REST API (Express 5, MySQL2 连接池, csv-parser, swagger, dotenv)
- **apps/nextjs** - 前端 (Next.js 16 Pages Router, Tailwind CSS v4, zustand, react-query, echarts)
- **Docker Compose** - MySQL 8.0 数据库

## Key Commands

```bash
pnpm install                                  # 安装依赖
cp apps/express/.env.example apps/express/.env  # 初始化后端环境变量
cp apps/nextjs/.env.example apps/nextjs/.env    # 初始化前端环境变量
pnpm --filter @demo-of-app-roi/shared build   # 构建共享包 (首次必须)
docker compose up -d                          # 启动 MySQL
pnpm dev                                      # 同时启动前后端
pnpm dev:express                              # 仅启动后端 :3001
pnpm dev:next                                 # 仅启动前端 :3000
pnpm build                                    # 全量构建
pnpm build:apps                               # 仅构建 apps（并行）
```

## Environment Variables

**apps/express/.env**（使用 `dotenv` 自动加载）:
```env
NODE_ENV=development   # development 时 /clear 接口可用，production 时 403
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_roi_user
DB_PASSWORD=app_roi_pass
DB_NAME=app_roi
```

**apps/nextjs/.env**（Next.js 自动加载）:
```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Data Import

```bash
curl -X POST http://localhost:3001/api/roi/import -F "file=@example/app_roi_data.csv"
```

## Database

- MySQL 8.0, Docker, 连接信息见 `apps/express/.env`
- Schema: `apps/express/src/db/schema.sql`
- **NULL = 日期不足无数据, 0 = 真实的 0% ROI**

## API Endpoints

- `GET /api/roi/filters` - 筛选器选项
- `GET /api/roi/data?app=&country=&predict=true` - ROI 数据查询
- `POST /api/roi/import` - CSV 导入 (multipart/form-data)
- `DELETE /api/roi/clear` - 清空所有数据 (**仅 NODE_ENV=development 可用，否则 403**)
- `GET /api/docs` - Swagger 文档
- `GET /api/health` - 健康检查

## Code Conventions

- Immutable data patterns (no mutation)
- Shared types in `packages/shared/src/types.ts`
- API response envelope: `{ success, data, error }`
- ROI values stored as percentages (6.79 = 6.79%, not 0.0679)
