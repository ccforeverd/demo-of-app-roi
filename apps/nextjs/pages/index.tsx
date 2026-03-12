import { FilterBar } from "../components/FilterBar";
import { DisplayControls } from "../components/DisplayControls";
import { RoiChart } from "../components/RoiChart";
import { useRoiStore } from "../store/useRoiStore";
import { useRoiChartData } from "../hooks/useRoiData";
import { CsvUpload } from "../components/CsvUpload";

export default function Home() {
  const { app, displayMode, yAxisScale } = useRoiStore();

  const { data: roiData, isLoading, error } = useRoiChartData();

  const title = app ? `${app} - 多时间维度ROI趋势` : "多时间维度ROI趋势";
  const subtitle =
    displayMode === "moving_average" ? "(7日移动平均)" : "(原始数据)";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className="text-xs text-muted-foreground">数据范围: 最近90天</p>
      </div>

      <div className="mb-4">
        <FilterBar />
      </div>

      <div className="mb-6">
        <DisplayControls />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        {isLoading && (
          <div className="flex h-[500px] items-center justify-center text-muted-foreground">
            加载中...
          </div>
        )}
        {error && (
          <div className="flex h-[500px] items-center justify-center text-red-500">
            加载失败: {error instanceof Error ? error.message : "未知错误"}
          </div>
        )}
        {roiData && roiData.length > 0 && (
          <RoiChart
            data={roiData}
            displayMode={displayMode}
            yAxisScale={yAxisScale}
          />
        )}
        {roiData && roiData.length === 0 && (
          <div className="flex h-[500px] items-center justify-center">
            <CsvUpload />
          </div>
        )}
      </div>
    </div>
  );
}
