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

### 端口占用

| 服务 | 端口 |
|------|------|
| Next.js 前端 | 3000 |
| Express 后端 | 3001 |
| MySQL | 3306 |

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

文件: `apps/express/.env`

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_roi_user
DB_PASSWORD=app_roi_pass
DB_NAME=app_roi
```

## 4. 前端环境变量

文件: `apps/nextjs/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
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

# 启动后端
cd apps/express && pnpm start

# 前端使用 Next.js 生产模式
cd apps/nextjs && pnpm build && npx next start
```

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

# 数据库连接检查 (查看后端启动日志)
# 成功: "MySQL 连接成功"
# 失败: "MySQL 连接失败: ..."
```
