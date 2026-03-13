# CLAUDE.md

## Project Overview

App ROI Dashboard - 应用投资回报率趋势数据看板系统。TypeScript monorepo, pnpm workspaces。

## Architecture

```
├── apps/nextjs          # Next.js 前端（见 apps/nextjs/CLAUDE.md）
├── apps/express         # Express 后端 API（见 apps/express/CLAUDE.md）
├── packages/shared      # 前后端公共类型与常量
├── packages/components  # 共享 React 组件
├── packages/foo         # 共享工具包
└── docker-compose.yml   # MySQL 8.0 数据库
```

## Key Commands

```bash
pnpm install                                    # 安装依赖
cp apps/express/.env.example apps/express/.env  # 初始化后端环境变量
cp apps/nextjs/.env.example apps/nextjs/.env    # 初始化前端环境变量
pnpm --filter @demo-of-app-roi/shared build     # 构建共享包（首次必须）
docker compose up -d                            # 启动 MySQL
pnpm dev                                        # 同时启动前后端
pnpm dev:express                                # 仅启动后端 :3001
pnpm dev:next                                   # 仅启动前端 :3000
pnpm build                                      # 全量构建（packages + apps 按依赖顺序）
pnpm build:apps                                 # 仅构建 apps（并行）
pnpm run lint                                   # ESLint 检查
```

## Shared Package

`packages/shared/src/types.ts` — 前后端共用的 TypeScript 类型与常量：

- `RoiDataPoint` — 单条 ROI 数据点
- `RoiQueryParams` — 查询参数
- `FilterOptions` — 筛选器选项
- `ApiResponse<T>` — 统一响应信封 `{ success, data, error }`
- `ROI_PERIODS` — ROI 周期数组 `[0,1,3,7,14,30,60,90]`
- `DisplayMode` / `YAxisScale` — 前端展示模式类型

## Database

- MySQL 8.0，通过 Docker Compose 启动
- Schema: `apps/express/src/db/schema.sql`（容器首次启动时自动初始化）
- 连接信息见 `apps/express/.env`
- **NULL = 日期不足无数据，0 = 真实的 0% ROI**

## Code Conventions

- 共享类型统一定义在 `packages/shared/src/types.ts`，前后端均从此 import
- API 响应统一封装：`{ success: boolean, data: T | null, error: string | null }`
- ROI 值以百分比形式存储（`6.79` = 6.79%，非 `0.0679`）
- Immutable data patterns，不直接 mutate 对象

## Security (Global)

- **`.env` 不入库**：已在根 `.gitignore` 中配置 `**/.env`，`.env.example` 作为模板提交
- 详细安全实现见 `apps/express/CLAUDE.md`
