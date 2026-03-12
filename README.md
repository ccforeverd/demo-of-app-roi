# demo-of-app-roi

应用 ROI（投资回报率）趋势数据看板系统，包含 CSV 数据导入、后端 API、前端图表交互展示的完整全栈链路。

## 结构

```text
├── apps/nextjs          # Next.js 前端（端口 3000）
├── apps/express         # Express 后端 API（端口 3001）
├── packages/shared      # 前后端公共类型与常量
├── packages/components  # 共享 React 组件
├── packages/foo         # 共享工具包
└── docker-compose.yml   # MySQL 8.0 数据库
```

## 前置条件

- Node.js >= 18
- pnpm >= 10
- Docker & Docker Compose

## 安装

```sh
# 1. 安装依赖
pnpm install

# 2. 复制环境变量文件
cp apps/express/.env.example apps/express/.env
cp apps/nextjs/.env.example apps/nextjs/.env

# 3. 构建共享包（首次必须，后端和前端都依赖它）
pnpm --filter @demo-of-app-roi/shared build
```

## 启动数据库

```sh
# 启动 MySQL 容器（首次启动会自动建表）
docker compose up -d

# 确认容器运行中
docker compose ps
```

默认连接信息（见 `apps/express/.env`，从 `.env.example` 复制）：

| 配置项   | 值           |
| -------- | ------------ |
| Host     | localhost    |
| Port     | 3306         |
| Database | app_roi      |
| User     | app_roi_user |
| Password | app_roi_pass |

## 启动开发服务

```sh
# 一键启动前后端
pnpm dev

# 或单独启动
pnpm dev:express   # 后端 http://localhost:3001
pnpm dev:next      # 前端 http://localhost:3000
```

## 导入数据

### 方式一：页面上传

打开 <http://localhost:3000> ，首次无数据时页面会显示"上传 CSV 文件"按钮，选择 `example/app_roi_data.csv` 即可导入。

### 方式二：命令行

```sh
curl -X POST http://localhost:3001/api/roi/import \
  -F "file=@example/app_roi_data.csv"
```

### 清空数据（仅开发环境）

需要 `apps/express/.env` 中设置 `NODE_ENV=development`，否则返回 403。

```sh
curl -X DELETE http://localhost:3001/api/roi/clear
```

## 访问地址

| 服务         | 地址                                    |
| ------------ | --------------------------------------- |
| 前端页面     | <http://localhost:3000>                 |
| 后端 API     | <http://localhost:3001>                 |
| Swagger 文档 | <http://localhost:3001/api-docs>        |
| 健康检查     | <http://localhost:3001/api/health>      |

## 调试

### 后端调试

后端使用 `tsx watch` 运行，修改 `apps/express/src/` 下的文件会自动热重载。

如果修改后未生效，手动触发重载：

```sh
touch apps/express/src/index.ts
```

查看后端运行日志：启动时会打印 `MySQL 连接成功` 或 `MySQL 连接失败` 以确认数据库连接状态。

### 前端调试

Next.js 开发模式自带 HMR，修改即时生效。

API 地址通过环境变量配置，如需修改：

```sh
# apps/nextjs/.env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 数据库调试

```sh
# 进入 MySQL 容器
docker compose exec mysql mysql -u app_roi_user -papp_roi_pass app_roi

# 查看数据条数
SELECT COUNT(*) FROM roi_data;

# 查看某天数据
SELECT * FROM roi_data WHERE date = '2025-04-13' LIMIT 5;

# 查看数据库表结构
DESCRIBE roi_data;
```

### 常见问题

#### 导入报错 500

CSV 文件可能包含 UTF-8 BOM 头，代码已通过 `mapHeaders` 自动处理。如仍有问题，检查后端日志输出。

#### MySQL 连接失败

```sh
# 确认容器正常运行
docker compose ps

# 查看容器日志
docker compose logs mysql

# 确认端口未被占用
lsof -i :3306
```

#### 修改后端代码后 API 行为未变化

`tsx watch` 偶尔不会检测到子目录文件变更，手动 `touch apps/express/src/index.ts` 强制重载。
