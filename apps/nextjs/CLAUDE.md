# apps/nextjs — CLAUDE.md

Next.js 前端页面，ROI 数据看板。

## Tech Stack

| 依赖 | 用途 |
|------|------|
| Next.js 16 (Pages Router) | SSR/SSG 框架 |
| Tailwind CSS v4 | 原子化 CSS |
| zustand | 全局筛选状态管理 |
| @tanstack/react-query | 数据获取、缓存、自动刷新 |
| echarts + echarts-for-react | 折线图渲染 |

## Commands

```bash
pnpm dev      # next dev（热重载，端口读取自 .env PORT）
pnpm build    # next build（生产构建）
pnpm start    # next start（生产启动，需先 build）
pnpm clean    # rimraf .next
```

## Environment Variables

文件：`.env`（从 `.env.example` 复制，Next.js 自动加载）

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001   # 后端 API 地址，暴露到浏览器端
```

> `NEXT_PUBLIC_` 前缀的变量会打包进客户端代码，**不要在此处放任何密钥**。

## Source Structure

```
pages/
├── _app.tsx              # QueryClient 初始化，全局样式注入
└── index.tsx             # 主页：FilterBar + DisplayControls + RoiChart

components/
├── FilterBar.tsx         # 顶部筛选器（安装渠道、出价类型、国家、APP）
├── DisplayControls.tsx   # 显示控制（移动平均/原始数据、线性/对数刻度）
├── CsvUpload.tsx         # CSV 文件上传组件（无数据时显示）
├── RoiChart.tsx          # ECharts 折线图（含移动平均、线性预测、回本基准线）
└── ui/
    ├── select.tsx        # 下拉选择组件
    └── radio-group.tsx   # 单选组组件

store/
└── useRoiStore.ts        # zustand store：筛选状态 + displayMode + yAxisScale

hooks/
├── useRoiData.ts         # useFilters()、useRoiChartData()（react-query）
└── ...

lib/
└── api.ts                # API 客户端：fetchFilters、fetchRoiData、uploadCsv、clearData
```

## State Management

`store/useRoiStore.ts`（zustand）管理全局筛选状态：

| 状态 | 类型 | 默认值 |
|------|------|--------|
| `app` | string | `""` |
| `country` | string | `""` |
| `bidType` | string | `""` |
| `installChannel` | string | `""` |
| `displayMode` | `"moving_average" \| "raw"` | `"moving_average"` |
| `yAxisScale` | `"linear" \| "log"` | `"log"` |

## Data Flow

1. 筛选器变更 → zustand store 更新
2. `useRoiChartData()` 监听 store → react-query 自动重新请求 `GET /api/roi/data`
3. 数据返回 → `RoiChart` 重新渲染 ECharts 图表

## API Client (`lib/api.ts`)

- `API_BASE`：从 `NEXT_PUBLIC_API_URL` 读取，默认 `http://localhost:3001`
- `fetchFilters()` → `GET /api/roi/filters`
- `fetchRoiData(params)` → `GET /api/roi/data?...`
- `uploadCsv(file)` → `POST /api/roi/import`
- `clearData()` → `DELETE /api/roi/clear`（仅开发环境后端允许）

## Chart Features (`RoiChart.tsx`)

- 8 条实线：当日/1日/3日/7日/14日/30日/60日/90日 ROI
- 虚线：线性外推预测数据（颜色与对应实线一致）
- 红色水平线：100% 回本基准线
- Tooltip：悬停显示该日期所有维度的具体 ROI 值
- 图例点击：显示/隐藏对应数据线
- 移动平均：7 日移动平均，平滑曲线波动
- Y 轴：线性刻度 / 对数刻度切换
