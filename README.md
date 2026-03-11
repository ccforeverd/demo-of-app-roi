# demo-of-app-roi

仅保留 **Next.js** 与 **Express** 的 TypeScript 单体仓库示例。

## 结构

- **apps/nextjs**：Next.js 前端（默认端口 3000）
- **apps/express**：Express 后端 API（默认端口 3001）
- **packages/components**：共享 React 组件（Next.js 使用）
- **packages/foo**：共享工具包

## 安装与启动

```sh
# 安装依赖
pnpm i

# 构建所有包（含 nextjs、express、packages）
pnpm run build
```

### 开发

**一键启动所有 app 开发服务：**

```sh
pnpm run dev
# 同时启动 Next.js（3000）与 Express（3001）
```

**单独启动：**

```sh
pnpm run dev:next    # 仅 Next.js，http://localhost:3000
pnpm run dev:express # 仅 Express，http://localhost:3001
```

## 访问页面

- Next.js 页面：<http://localhost:3000>
- Express 根路径：<http://localhost:3001>（返回 JSON）
- Express 健康检查：<http://localhost:3001/api/health>
