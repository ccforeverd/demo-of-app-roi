# 部署文档 (DEPLOYMENT.md)

## 1. 环境配置要求

### 系统要求

| 组件 | 最低版本 |
|------|----------|
| Node.js | 18.x |
| pnpm | 10.x |
| Docker | 20.x |
| Docker Compose | 2.x |
| MySQL | 8.0 |

### 端口占用（开发模式）

| 服务 | 端口 |
|------|------|
| Next.js 前端 | 3000 |
| Express 后端 | 3001 |
| MySQL | 3306 |

### 端口占用（Docker 一体化部署）

| 服务 | 端口 |
|------|------|
| 对外入口（Next.js） | 3000（可通过 `APP_PORT` 覆盖） |
| 容器内 Express | 3001（仅容器内访问） |
| MySQL | 3306（容器网络） |

## 2. 数据库配置

### Docker Compose 方式 (推荐)

```bash
docker compose up -d
```

默认配置 (docker-compose.yml):

| 配置项 | 值 |
|--------|-----|
| 数据库名 | app_roi |
| 用户名 | app_roi_user |
| 密码 | app_roi_pass |
| Root 密码 | root123 |
| 字符集 | utf8mb4 |

数据库 schema 在容器首次启动时自动初始化 (挂载 `schema.sql` 到 `/docker-entrypoint-initdb.d/`)。

### 手动配置 MySQL

如果不使用 Docker, 手动执行:

```bash
mysql -u root -p < apps/express/src/db/schema.sql
```

## 3. 后端环境变量

文件: `apps/express/.env`（从 `.env.example` 复制）

后端使用 `dotenv` 自动加载该文件，无需额外配置。

```env
NODE_ENV=development          # 开发环境；生产部署改为 production
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000   # 允许跨域的前端地址，多个用逗号分隔
QUERY_LIMIT=50000             # 单次查询最大返回行数，默认 50000
MYSQL_ROOT_PASSWORD=root123   # Docker Compose MySQL root 密码
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_roi_user
DB_PASSWORD=app_roi_pass
DB_NAME=app_roi
```

**各变量说明:**

| 变量 | 说明 | 生产建议 |
|------|------|---------|
| `NODE_ENV` | 运行环境；`development` 时 `/clear` 接口可用 | 改为 `production` |
| `ALLOWED_ORIGINS` | CORS 白名单，仅列出的域名可跨域访问 API | 改为实际前端域名 |
| `QUERY_LIMIT` | 防止全表查询导致内存溢出 | 按业务调整 |
| `MYSQL_ROOT_PASSWORD` | 仅 docker-compose 使用 | 改为强密码 |
| `DB_PASSWORD` | 数据库连接密码 | 改为强密码 |

> 生产环境中，`DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME` 为必填项；缺失时服务将拒绝启动。

### 生产环境最小配置示例

```env
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-frontend-domain.com
QUERY_LIMIT=50000
MYSQL_ROOT_PASSWORD=<strong-root-password>
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=<strong-password>
DB_NAME=app_roi
```

## 4. 前端环境变量

文件: `apps/nextjs/.env`（从 `.env.example` 复制）

Next.js 自动加载该文件。

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Docker 一体化部署时推荐：

```env
NEXT_PUBLIC_API_URL=/api
```

## 5. 构建与启动

### 开发模式

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:express
pnpm dev:next
```

### 生产构建

```bash
# 构建所有包
pnpm build

# 修改后端 .env：NODE_ENV=production（屏蔽 clear 接口）
# 启动后端
cd apps/express && pnpm start

# 前端使用 Next.js 生产模式
cd apps/nextjs && npx next start
```

### Docker 一体化部署（推荐生产演示）

```bash
# 启动（构建 app 镜像 + 启动 app + mysql）
pnpm docker:up

# 若本机 3000 被占用，可覆盖对外端口
APP_PORT=3300 pnpm docker:up

# 查看状态
docker compose -f docker-compose.deploy.yml ps

# 查看日志
docker compose -f docker-compose.deploy.yml logs -f app

# 停止
pnpm docker:stop
```

说明：
- 前端统一通过 `/api/*` 访问后端（Next.js rewrite 转发到容器内 Express）
- Docker 模式下建议将 `NEXT_PUBLIC_API_URL` 设为 `/api`（`docker-compose.deploy.yml` 已内置）

## 6. 数据初始化

启动后端服务后, 导入示例数据:

```bash
curl -X POST http://localhost:3001/api/roi/import \
  -F "file=@example/app_roi_data.csv"
```

## 7. 健康检查

```bash
# 后端健康检查
curl http://localhost:3001/api/health

# Docker 一体化部署健康检查（通过前端网关）
curl http://localhost:3000/api/health

# 数据库连接检查 (查看后端启动日志)
# 成功: "MySQL 连接成功"
# 失败: "MySQL 连接失败: ..."
```

## 8. 安全注意事项

| 项目 | 开发环境 | 生产环境 |
|------|---------|---------|
| `NODE_ENV` | `development` | **`production`**（屏蔽 `/clear` 接口） |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | **实际前端域名**，不可使用通配符 |
| 数据库密码 | 示例弱密码 | **强密码**，不得与示例相同 |
| `.env` 文件 | 本地保留 | **不提交 Git**（已在 `.gitignore` 中配置） |
| 错误信息 | 返回详细 message | 统一返回"内部服务器错误"，细节仅记录到服务端日志 |
