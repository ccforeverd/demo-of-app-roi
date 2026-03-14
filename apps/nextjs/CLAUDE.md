# apps/nextjs — CLAUDE.md

Next.js 前端页面，ROI 数据看板。

## Tech Stack

| 依赖 | 用途 |
|------|------|
| Next.js 16 (Pages Router) | SSR/SSG 框架 |
| Tailwind CSS v4 | 原子化 CSS（`@theme inline` 双层 CSS 变量模式） |
| zustand | 全局状态管理（筛选、主题、Toast） |
| @tanstack/react-query | 数据获取、缓存、自动刷新 |
| echarts + echarts-for-react | 折线图渲染（主题感知配色） |
| react-icons | 图标库（主要使用 `fa6` 集合） |

## Commands

```bash
pnpm dev      # next dev（热重载，端口读取自 .env PORT）
pnpm build    # next build（生产构建）
pnpm start    # next start（生产启动，需先 build）
pnpm test     # vitest run（单元测试）
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

```text
pages/
├── _app.tsx              # QueryClient 初始化、全局样式注入、主题初始化（ThemeApplier）
└── index.tsx             # 主页：Header + Sidebar(FilterBar/DisplayControls/CsvUpload) + Main(RoiSummaryCards/RoiChart)

components/
├── FilterBar.tsx         # 侧边栏筛选器（安装渠道、出价类型、国家、APP）
├── DisplayControls.tsx   # 显示控制（移动平均/原始数据、线性/对数刻度）
├── CsvUpload.tsx         # CSV 文件上传组件（含上传进度 spinner）
├── RoiChart.tsx          # ECharts 折线图（含移动平均、线性预测、回本基准线，主题感知配色）
├── RoiSummaryCards.tsx   # ROI 摘要卡片（D0/D7/D30 最新值 + 趋势箭头）
├── Toast.tsx             # 全局 Toast 通知组件（成功/错误反馈）
└── ui/
    ├── select.tsx        # 下拉选择组件（主题感知）
    └── radio-group.tsx   # Toggle 按钮组组件

store/
├── useRoiStore.ts        # zustand store：筛选状态 + displayMode + yAxisScale
├── useThemeStore.ts      # zustand store：深色/浅色主题切换，localStorage 持久化
└── useToastStore.ts      # zustand store：Toast 通知队列，自动 3s 消失

hooks/
├── useRoiData.ts         # useFilters()、useRoiChartData()（react-query）
└── ...

styles/
└── globals.css           # Tailwind v4 @theme inline + 双主题 CSS 变量 + 主题切换过渡动画

lib/
└── api.ts                # API 客户端：fetchFilters、fetchRoiData、uploadCsv、clearData
```

## State Management

### `store/useRoiStore.ts` — 筛选与显示状态

| 状态 | 类型 | 默认值 |
|------|------|--------|
| `app` | string | `""` |
| `country` | string | `""` |
| `bidType` | string | `""` |
| `installChannel` | string | `""` |
| `displayMode` | `"moving_average" \| "raw"` | `"moving_average"` |
| `yAxisScale` | `"linear" \| "log"` | `"log"` |

### `store/useThemeStore.ts` — 主题状态

| 状态/方法 | 说明 |
|-----------|------|
| `theme` | `"dark" \| "light"`，默认 `"dark"`，持久化到 `localStorage` |
| `toggleTheme()` | 切换主题，自动更新 `localStorage` 并触发 0.4s CSS 过渡动画 |
| `initTheme()` | 从 `localStorage` 读取已保存主题，在 `_app.tsx` 挂载时调用 |

### `store/useToastStore.ts` — Toast 通知状态

| 状态/方法 | 说明 |
|-----------|------|
| `toasts` | 当前活跃的 Toast 列表 |
| `addToast(message, type)` | 添加 Toast，3000ms 后自动移除 |
| `removeToast(id)` | 手动移除指定 Toast |

## Theming

采用 Tailwind CSS v4 `@theme inline` + 双层 CSS 变量模式实现深色/浅色主题切换：

1. `globals.css` 中 `@theme inline` 定义 `--color-*` 引用 `var(--background)` 等中间变量
2. `:root` 定义浅色主题变量值，`.dark` 类覆盖为深色值
3. `_app.tsx` 中 `ThemeApplier` 组件通过 `useEffect` 监听 `useThemeStore`，在 `<html>` 上切换 `.dark` 类
4. 主题切换时临时添加 `data-theme-transition` 属性到 `<html>`，触发 0.4s CSS 过渡动画，500ms 后自动移除

主色调：橘黄色（浅色 `#ea580c`，深色 `#f97316`）

## Layout

采用全屏侧边栏布局：

- **Header**（h-14）：标题、数据点计数、主题切换按钮
- **Sidebar**（w-72）：筛选条件、显示设置、数据管理（CSV 上传）
  - 桌面端（lg+）：固定显示
  - 移动端/平板：汉堡菜单触发抽屉式侧边栏 + 半透明遮罩
- **Main**：ROI 摘要卡片 + 图表区域

## Icons

使用 `react-icons` 库，主要来自 `react-icons/fa6`（Font Awesome 6）：

- 导航：`FaBars`（汉堡菜单）
- 主题：`FaSun` / `FaMoon`（主题切换）
- 侧边栏标题：`FaFilter` / `FaSliders` / `FaDatabase`
- 数据：`FaChartLine`（空状态）、`FaUpload` / `FaSpinner`（上传）
- 趋势：`FaArrowTrendUp` / `FaArrowTrendDown`（摘要卡片）
- Toast：`FaCircleCheck` / `FaCircleXmark` / `FaXmark`

## Data Flow

1. 筛选器变更 → zustand store 更新
2. `useRoiChartData()` 监听 store → react-query 自动重新请求 `GET /api/roi/data`
3. 数据返回 → `RoiSummaryCards` 显示最新 ROI 摘要 + `RoiChart` 重新渲染 ECharts 图表

## API Client (`lib/api.ts`)

- `API_BASE`：从 `NEXT_PUBLIC_API_URL` 读取，默认 `http://localhost:3001`
- 当 `NEXT_PUBLIC_API_URL=/api`（Docker 一体化部署）时，`lib/api.ts` 会自动去重前缀，避免出现 `/api/api/*`
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
