# 系统设计文档 (DESIGN.md)

## 1. 整体架构

```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐      MySQL       ┌────────────┐
│   Next.js 前端   │ ◄──────────────► │  Express 后端 API  │ ◄──────────────► │  MySQL 8.0  │
│  (Pages Router)  │                   │   (RESTful + Swagger) │              │ (Docker)    │
└─────────────────┘                   └──────────────────┘                  └────────────┘
        │                                      │
        ▼                                      ▼
  ┌──────────┐                         ┌──────────────┐
  │ zustand   │                         │ packages/shared │
  │ react-query│                        │ (类型 & 常量)   │
  │ echarts    │                        └──────────────┘
  └──────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (Pages Router), Tailwind CSS v4, zustand, @tanstack/react-query, echarts |
| 后端 | Express 5, csv-parser, mysql2 (连接池), swagger-jsdoc + swagger-ui-express |
| 数据库 | MySQL 8.0 (Docker) |
| 公共包 | @demo-of-app-roi/shared (TypeScript 类型、常量) |
| 包管理 | pnpm workspaces (monorepo) |

## 2. 数据库表结构

### roi_data 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| date | DATE | 数据日期 |
| app | VARCHAR(50) | 应用名称 |
| bid_type | VARCHAR(20) | 出价类型 (如 CPI) |
| country | VARCHAR(50) | 国家地区 |
| install_channel | VARCHAR(50) | 安装渠道 (默认 Apple) |
| install_count | INT | 安装总次数 |
| roi_d0 ~ roi_d90 | DECIMAL(10,4) NULL | 各时间维度 ROI (百分比值) |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 关键设计: 区分"真实0%"与"日期不足0%"

- **NULL**: 表示日期不足导致无数据 (insufficient data)
- **0.0000**: 表示真实的 0% ROI (如安装量为0时)

判断规则 (CSV 导入时):
1. 若 `install_count = 0` 且 ROI = 0% → 存为 `0` (真实零值)
2. 若 `install_count > 0` 且 ROI = 0% 且 `date + period_days > max_date` → 存为 `NULL` (日期不足)
3. 其他情况 → 存为实际值

### 索引

- 唯一索引: `(date, app, bid_type, country, install_channel)`
- 单列索引: `app`, `country`, `date`, `bid_type`, `install_channel`

## 3. API 接口规范

基础路径: `/api/roi`

### GET /api/roi/filters

获取所有筛选器可选项。

**响应:**
```json
{
  "success": true,
  "data": {
    "apps": ["App-1", "App-2", ...],
    "countries": ["美国", "英国"],
    "bid_types": ["CPI"],
    "install_channels": ["Apple"],
    "date_range": { "min": "2025-04-13", "max": "2025-07-12" }
  },
  "error": null
}
```

### GET /api/roi/data

查询 ROI 数据, 支持筛选和预测。

**查询参数:**

| 参数 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|---------|------|
| app | string | 否 | 最大 100 字符 | 应用名称 |
| country | string | 否 | 最大 100 字符 | 国家地区 |
| bid_type | string | 否 | 最大 100 字符 | 出价类型 |
| install_channel | string | 否 | 最大 100 字符 | 安装渠道 |
| start_date | string | 否 | 格式 `YYYY-MM-DD` | 起始日期 |
| end_date | string | 否 | 格式 `YYYY-MM-DD` | 结束日期 |
| predict | boolean | 否 | — | 是否返回线性外推预测数据 |

**参数校验失败返回 400:**
```json
{ "success": false, "data": null, "error": "参数 start_date 格式应为 YYYY-MM-DD" }
```

**返回行数上限:** 由环境变量 `QUERY_LIMIT` 控制，默认 50000 行。

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-04-13",
      "roi_d0": 6.79, "roi_d1": 14.24, ...,
      "predicted": { "roi_d0": false, "roi_d90": true }
    }
  ],
  "error": null
}
```

### POST /api/roi/import

上传并导入 CSV 文件。

**请求:** `multipart/form-data`, 字段名 `file`

**响应:**
```json
{
  "success": true,
  "data": {
    "total_rows": 910,
    "imported_rows": 910,
    "skipped_rows": 0,
    "errors": []
  },
  "error": null
}
```

### DELETE /api/roi/clear

清空所有 ROI 数据。**仅开发环境可调用**（`NODE_ENV=development`），其他环境返回 403。

**响应:**
```json
{ "success": true, "data": { "deleted_rows": 910 }, "error": null }
```

## 4. 安全设计

| 层级 | 措施 | 实现位置 |
|------|------|---------|
| CORS | `ALLOWED_ORIGINS` 白名单，拒绝未列出的 origin | `apps/express/src/index.ts` |
| 输入校验 | 日期格式 + 字符串长度校验，不合法返回 400 | `routes/roi.routes.ts` `validateQueryParams()` |
| 查询限制 | `LIMIT ${QUERY_LIMIT}` 防止全表返回 | `services/roi.service.ts` `queryRoiData()` |
| 错误脱敏 | 生产环境返回通用错误，细节仅记录服务端日志 | `routes/roi.routes.ts` `safeErrorMsg()` |
| Dev-only 接口 | `NODE_ENV !== development` 时 `/clear` 返回 403 | `routes/roi.routes.ts` `devOnly` 中间件 |
| DB 凭据 | 生产环境必须通过环境变量注入，缺失时服务拒绝启动 | `db/pool.ts` `requireEnv()` |
| 连接池 | `queueLimit=100`，防止连接请求无限堆积 | `db/pool.ts` |
| JSON body | 请求体限制 1MB，防止大体积请求 DoS | `apps/express/src/index.ts` |

## 5. 前端组件架构

```
pages/index.tsx (主页)
├── components/FilterBar.tsx (顶部筛选器)
│   └── components/ui/select.tsx
├── components/DisplayControls.tsx (显示控制器)
│   └── components/ui/radio-group.tsx
└── components/RoiChart.tsx (核心图表)

store/useRoiStore.ts (zustand 状态管理)
hooks/useRoiData.ts (react-query 数据获取)
lib/api.ts (API 客户端)
```

### 状态管理 (zustand)

全局筛选状态: `app`, `country`, `bidType`, `installChannel`, `displayMode`, `yAxisScale`

### 数据流

1. 筛选器变更 → zustand store 更新
2. react-query 监听 store 变化 → 自动重新请求 API
3. 数据返回 → echarts 图表重新渲染

### 图表功能

- 8 条实线: 对应 当日/1日/3日/7日/14日/30日/60日/90日 ROI
- 虚线: 线性外推预测数据 (颜色与对应实线一致)
- 红色水平线: 100% 回本基准线
- 移动平均 / 原始数据 切换
- 线性刻度 / 对数刻度 切换
- 图例点击: 显示/隐藏对应数据线
- Tooltip: 鼠标悬停显示具体数值
