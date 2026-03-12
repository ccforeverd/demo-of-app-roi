import React, { useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { RoiDataPoint, DisplayMode, YAxisScale } from "@demo-of-app-roi/shared";
import { ROI_PERIODS, ROI_PERIOD_LABELS, ROI_CHART_COLORS, MOVING_AVERAGE_DAYS, BREAKEVEN_LINE_COLOR } from "@demo-of-app-roi/shared";

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);

interface RoiChartProps {
  readonly data: RoiDataPoint[];
  readonly displayMode: DisplayMode;
  readonly yAxisScale: YAxisScale;
}

/** 计算移动平均 */
function movingAverage(values: (number | null)[], window: number): (number | null)[] {
  return values.map((_, idx) => {
    const start = Math.max(0, idx - window + 1);
    const slice = values.slice(start, idx + 1).filter((v): v is number => v != null);
    if (slice.length === 0) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function RoiChart({ data, displayMode, yAxisScale }: RoiChartProps) {
  const option = useMemo(() => {
    const dates = data.map((d) => d.date);

    const series = ROI_PERIODS.flatMap((period) => {
      const col = `roi_d${period}` as keyof RoiDataPoint;
      const color = ROI_CHART_COLORS[col as string];
      const label = `${ROI_PERIOD_LABELS[period]}(7日均值)`;
      const rawValues = data.map((d) => d[col] as number | null);

      const displayValues =
        displayMode === "moving_average"
          ? movingAverage(rawValues, MOVING_AVERAGE_DAYS)
          : rawValues;

      // 分割实际数据和预测数据
      const realData: (number | null)[] = [];
      const predictedData: (number | null)[] = [];
      let lastRealIdx = -1;

      data.forEach((d, i) => {
        const isPredicted = d.predicted[`roi_d${period}`];
        if (isPredicted) {
          realData.push(null);
          predictedData.push(displayValues[i]);
        } else {
          realData.push(displayValues[i]);
          predictedData.push(null);
          lastRealIdx = i;
        }
      });

      // 让预测线与实际线连接: 在预测线的起始位置也放置最后一个实际值
      if (lastRealIdx >= 0 && lastRealIdx < data.length - 1) {
        predictedData[lastRealIdx] = realData[lastRealIdx];
      }

      const baseSeries = {
        name: label,
        type: "line" as const,
        data: realData,
        symbol: "none",
        lineStyle: { width: 2, color },
        itemStyle: { color },
        markLine:
          period === ROI_PERIODS[0]
            ? {
                silent: true,
                symbol: "none",
                data: [
                  {
                    yAxis: 100,
                    lineStyle: { color: BREAKEVEN_LINE_COLOR, width: 2, type: "solid" as const },
                    label: {
                      formatter: "100%回本线",
                      position: "insideStartTop" as const,
                      color: BREAKEVEN_LINE_COLOR,
                      fontSize: 12,
                    },
                  },
                ],
              }
            : undefined,
      };

      const predSeries = {
        name: `${label} 预测`,
        type: "line" as const,
        data: predictedData,
        symbol: "none",
        lineStyle: { width: 2, color, type: "dashed" as const },
        itemStyle: { color },
      };

      return [baseSeries, predSeries];
    });

    return {
      tooltip: {
        trigger: "axis" as const,
        formatter: (params: Array<{ seriesName: string; value: number | null; marker: string }>) => {
          const validParams = params.filter((p) => p.value != null);
          if (validParams.length === 0) return "";
          const header = `<div style="font-weight:bold;margin-bottom:4px">${(params as Array<{ axisValueLabel?: string }>)[0]?.axisValueLabel ?? ""}</div>`;
          const rows = validParams
            .map((p) => `<div>${p.marker} ${p.seriesName}: ${(p.value as number).toFixed(2)}%</div>`)
            .join("");
          return header + rows;
        },
      },
      legend: {
        type: "scroll" as const,
        bottom: 0,
        data: ROI_PERIODS.map((p) => `${ROI_PERIOD_LABELS[p]}(7日均值)`).concat(
          ROI_PERIODS.map((p) => `${ROI_PERIOD_LABELS[p]}(7日均值) 预测`)
        ),
        selected: Object.fromEntries(
          ROI_PERIODS.map((p) => [`${ROI_PERIOD_LABELS[p]}(7日均值) 预测`, true])
        ),
      },
      grid: {
        left: 60,
        right: 20,
        top: 20,
        bottom: 60,
      },
      xAxis: {
        type: "category" as const,
        data: dates,
        axisLabel: {
          formatter: (val: string) => {
            const d = new Date(val);
            return `${d.getMonth() + 1}月${d.getDate()}日`;
          },
          rotate: 45,
          fontSize: 10,
        },
        boundaryGap: false,
      },
      yAxis: {
        type: yAxisScale === "log" ? ("log" as const) : ("value" as const),
        axisLabel: {
          formatter: "{value}%",
        },
        min: yAxisScale === "log" ? 1 : undefined,
      },
      series,
    };
  }, [data, displayMode, yAxisScale]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: 500, width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
