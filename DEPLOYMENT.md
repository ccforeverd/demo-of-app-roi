# 部署文档 (DEPLOYMENT.md)

本文档覆盖从本地部署到生产部署的完整流程，包含环境依赖、数据库配置、项目安装、数据初始化、启动方式和生产环境配置。

## 1. 环境依赖清单（Node.js、数据库等）

| 组件 | 推荐版本 | 说明 |
|---|---|---|
| Node.js | >= 18（推荐 20+） | 前后端运行环境 |
| pnpm | >= 10 | monorepo 包管理 |
| MySQL | 8.0 | 主数据库 |
| Docker | >= 20 | 推荐用于数据库与一体化部署 |
| Docker Compose | >= 2 | 容器编排 |

默认端口：

| 服务 | 端口 | 说明 |
|---|---|---|
| Next.js 前端 | 3000 | Web 页面入口 |
| Express 后端 | 3001 | API 服务 |
| MySQL | 3306 | 数据库服务 |

## 2. 数据库安装和配置

### 2.1 使用 Docker 安装 MySQL（推荐）

```bash
docker compose up -d
```

`docker-compose.yml` 默认配置：

- 数据库名：`app_roi`
- 用户：`app_roi_user`
- 密码：`app_roi_pass`
- Root 密码：`root123`
- 字符集：`utf8mb4`

数据库初始化脚本会在首次启动时自动执行：

- `apps/express/src/db/schema.sql` -> `/docker-entrypoint-initdb.d/01-schema.sql`

### 2.2 手动安装 MySQL（非 Docker）

创建数据库后执行：

```bash
mysql -u root -p < apps/express/src/db/schema.sql
```

并在 `apps/express/.env` 中设置正确的数据库连接：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_roi_user
DB_PASSWORD=app_roi_pass
DB_NAME=app_roi
```

## 3. 项目安装步骤

```bash
# 1) 安装依赖
pnpm install

# 2) 初始化环境变量
cp apps/express/.env.example apps/express/.env
cp apps/nextjs/.env.example apps/nextjs/.env

# 3) 首次构建共享包
pnpm --filter @demo-of-app-roi/shared build
```

后端关键环境变量（`apps/express/.env`）：

```env
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
QUERY_LIMIT=50000
MYSQL_ROOT_PASSWORD=root123
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_roi_user
DB_PASSWORD=app_roi_pass
DB_NAME=app_roi
```

前端关键环境变量（`apps/nextjs/.env`）：

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 4. 数据库初始化和 CSV 数据导入

### 4.1 初始化检查

启动后端后可检查健康状态：

```bash
curl http://localhost:3001/api/health
```

如果数据库连接成功，后端日志会显示 `MySQL 连接成功`。

### 4.2 导入 CSV 示例数据

```bash
curl -X POST http://localhost:3001/api/roi/import \
  -F "file=@example/app_roi_data.csv"
```

可选方式：通过 Swagger 导入

1. 打开 `http://localhost:3001/api-docs`
2. 找到 `POST /api/roi/import`
3. `Try it out` 并上传 CSV 执行

### 4.3 清空数据（仅开发环境）

```bash
curl -X DELETE http://localhost:3001/api/roi/clear
```

当 `NODE_ENV=development` 时可用，生产环境会返回 `403`。

## 5. 项目启动方式

### 5.1 开发模式启动

```bash
# 启动数据库
docker compose up -d

# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:express
pnpm dev:next
```

### 5.2 生产模式（非 Docker）

```bash
# 构建
pnpm build

# 分别启动
cd apps/express && pnpm start
cd apps/nextjs && npx next start
```

### 5.3 Docker 一体化启动（推荐生产演示）

```bash
# 启动
pnpm docker:up

# 自定义对外端口
APP_PORT=3300 pnpm docker:up

# 查看状态
docker compose -f docker-compose.deploy.yml ps

# 查看日志
docker compose -f docker-compose.deploy.yml logs -f app

# 停止
pnpm docker:stop
```

## 6. 生产环境配置

### 6.1 后端生产环境变量建议（`apps/express/.env`）

```env
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-frontend-domain.com
QUERY_LIMIT=50000
MYSQL_ROOT_PASSWORD=<strong-root-password>
DB_HOST=<your-db-host>
DB_PORT=3306
DB_USER=<your-db-user>
DB_PASSWORD=<strong-db-password>
DB_NAME=app_roi
```

生产环境中，`DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME` 为必填，缺失会导致服务拒绝启动。

### 6.2 前端生产环境变量建议（`apps/nextjs/.env`）

```env
PORT=3000
NEXT_PUBLIC_API_URL=/api
```

当采用 `docker-compose.deploy.yml` 一体化部署时，`NEXT_PUBLIC_API_URL` 已内置为 `/api`。

### 6.3 安全与发布检查清单

- `NODE_ENV` 必须为 `production`
- `/clear` 接口在生产不可用（403）
- `ALLOWED_ORIGINS` 仅允许真实前端域名
- 所有数据库密码使用强密码
- `.env` 不可提交到 Git 仓库
- 发布后执行健康检查：

```bash
curl http://localhost:3001/api/health
curl http://localhost:3000/api/health
```
