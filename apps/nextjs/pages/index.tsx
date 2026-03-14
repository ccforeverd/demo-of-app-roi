import { useState } from "react";
import { FilterBar } from "../components/FilterBar";
import { DisplayControls } from "../components/DisplayControls";
import { RoiChart } from "../components/RoiChart";
import { RoiSummaryCards } from "../components/RoiSummaryCards";
import { CsvUpload } from "../components/CsvUpload";
import { useRoiStore } from "../store/useRoiStore";
import { useRoiChartData } from "../hooks/useRoiData";
import { useThemeStore } from "../store/useThemeStore";

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 border-b border-border">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full h-full min-h-[400px] p-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="flex-1 bg-muted rounded" />
      <div className="h-8 bg-muted rounded w-full" />
    </div>
  );
}

export default function Home() {
  const { app, displayMode, yAxisScale } = useRoiStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: roiData, isLoading, error } = useRoiChartData();

  const title = app ? `${app} — ROI 趋势` : "多时间维度 ROI 趋势";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {/* Hamburger for mobile/pad */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="4.5" x2="16" y2="4.5" />
              <line x1="2" y1="9" x2="16" y2="9" />
              <line x1="2" y1="13.5" x2="16" y2="13.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {roiData && roiData.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {roiData.length} 个数据点
            </span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-20 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-72 flex-shrink-0 flex flex-col
            bg-card border-r border-border overflow-y-auto
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            top-14 lg:top-auto
          `}
        >
          <SidebarSection title="筛选条件">
            <FilterBar />
          </SidebarSection>

          <SidebarSection title="显示设置">
            <DisplayControls />
          </SidebarSection>

          <SidebarSection title="数据管理">
            <CsvUpload />
            <p className="text-xs text-muted-foreground">支持 CSV 格式，最近 90 天数据</p>
          </SidebarSection>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Summary cards */}
          {roiData && roiData.length > 0 && (
            <div className="flex-shrink-0 px-4 pt-4">
              <RoiSummaryCards data={roiData} />
            </div>
          )}

          {/* Chart area */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="h-full rounded-lg border border-border bg-card overflow-hidden">
              {isLoading && <ChartSkeleton />}
              {error && (
                <div className="flex h-full min-h-[400px] items-center justify-center text-red-500 text-sm">
                  加载失败: {error instanceof Error ? error.message : "未知错误"}
                </div>
              )}
              {roiData && roiData.length > 0 && (
                <div className="h-full min-h-[400px]">
                  <RoiChart
                    data={roiData}
                    displayMode={displayMode}
                    yAxisScale={yAxisScale}
                  />
                </div>
              )}
              {roiData && roiData.length === 0 && !isLoading && (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="text-4xl">📊</div>
                  <p className="text-sm">暂无数据，请在左侧上传 CSV 文件</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
