# 使用说明文档 (USER_GUIDE.md)

## 1. 项目安装运行指南

### 前置条件

- Node.js >= 18
- pnpm >= 10
- Docker & Docker Compose (用于 MySQL)

### 安装步骤

```bash
# 1. 克隆项目
git clone <repo-url>
cd demo-of-app-roi

# 2. 安装依赖
pnpm install

# 3. 复制环境变量文件
cp apps/express/.env.example apps/express/.env
cp apps/nextjs/.env.example apps/nextjs/.env

# 4. 构建共享包
pnpm --filter @demo-of-app-roi/shared build

# 5. 启动 MySQL
docker compose up -d

# 6. 一键启动前后端
pnpm dev

# 或分别启动
# pnpm dev:express   # 后端 http://localhost:3001
# pnpm dev:next      # 前端 http://localhost:3000
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:3000 |
| 后端 API | http://localhost:3001 |
| Swagger 文档 | http://localhost:3001/api-docs |

> 端口可在各应用的 `.env` 文件中通过 `PORT` 变量修改。

## 2. 数据操作指南

### 方式一: 通过 API 导入

```bash
curl -X POST http://localhost:3001/api/roi/import \
  -F "file=@example/app_roi_data.csv"
```

### 方式二: 通过 Swagger UI

1. 打开 http://localhost:3001/api-docs
2. 找到 `POST /api/roi/import`
3. 点击 "Try it out"
4. 上传 CSV 文件
5. 点击 "Execute"

### 清空数据（仅开发环境）

需要 `apps/express/.env` 中设置 `NODE_ENV=development`。

```bash
# 命令行
curl -X DELETE http://localhost:3001/api/roi/clear

# 或通过 Swagger UI：http://localhost:3001/api-docs
# 找到 DELETE /api/roi/clear → Try it out → Execute
```

> 生产环境中该接口返回 403，需将 `.env` 中 `NODE_ENV` 改为 `production`。

### CSV 文件格式要求

| 列名 | 说明 | 示例 |
|------|------|------|
| 日期 | 格式: YYYY-MM-DD(星期) | 2025-04-13(日) |
| app | 应用名称 | App-1 |
| 出价类型 | 出价模式 | CPI |
| 国家地区 | 国家名称 | 美国 |
| 应用安装.总次数 | 安装数量 | 4849 |
| 当日ROI ~ 90日ROI | 百分比值 | 6.79% |

## 3. 图表与筛选器使用说明

### 顶部筛选器

从左到右依次为:
1. **用户安装渠道** - 选择安装来源 (默认 Apple)
2. **出价类型** - 选择出价模式 (如 CPI)
3. **国家地区** - 选择国家
4. **APP** - 选择应用

选择"全部"可查看不筛选的数据。切换选择器时图表会自动更新。

### 显示控制器

- **数据显示模式**
  - 显示移动平均值: 7日移动平均, 平滑曲线波动
  - 显示原始数据: 展示每日原始 ROI 值

- **Y轴刻度**
  - 线性刻度: 等间距刻度
  - 对数刻度: 对数间距, 适合跨度大的数据

### 图表交互

- **鼠标悬停**: 显示该日期所有维度的具体 ROI 值
- **图例点击**: 点击底部图例可显示/隐藏对应的数据线
- **实线 vs 虚线**: 实线为实际数据, 虚线为线性外推预测值
- **红色水平线**: 100% 回本基准线, 超过此线表示已回本
