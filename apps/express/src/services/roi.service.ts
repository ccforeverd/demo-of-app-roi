import pool from "../db/pool";
import type { RoiDataPoint, RoiQueryParams, FilterOptions } from "@demo-of-app-roi/shared";
import { ROI_PERIODS } from "@demo-of-app-roi/shared";
import type { RowDataPacket } from "mysql2";

const ROI_COLUMNS = ROI_PERIODS.map((p) => `roi_d${p}`);

/** 查询 ROI 数据 */
export async function queryRoiData(params: RoiQueryParams): Promise<RoiDataPoint[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.app) {
    conditions.push("app = ?");
    values.push(params.app);
  }
  if (params.country) {
    conditions.push("country = ?");
    values.push(params.country);
  }
  if (params.bid_type) {
    conditions.push("bid_type = ?");
    values.push(params.bid_type);
  }
  if (params.install_channel) {
    conditions.push("install_channel = ?");
    values.push(params.install_channel);
  }
  if (params.start_date) {
    conditions.push("date >= ?");
    values.push(params.start_date);
  }
  if (params.end_date) {
    conditions.push("date <= ?");
    values.push(params.end_date);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT date, ${ROI_COLUMNS.join(", ")}, install_count
    FROM roi_data
    ${where}
    ORDER BY date ASC
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
  return rows.map((row) => toDataPoint(row));
}

function toDataPoint(row: RowDataPacket): RoiDataPoint {
  const predicted: Record<string, boolean> = {};
  for (const col of ROI_COLUMNS) {
    predicted[col] = false;
  }

  const dateStr =
    row.date instanceof Date
      ? row.date.toISOString().split("T")[0]
      : String(row.date);

  return {
    date: dateStr,
    roi_d0: row.roi_d0 != null ? Number(row.roi_d0) : null,
    roi_d1: row.roi_d1 != null ? Number(row.roi_d1) : null,
    roi_d3: row.roi_d3 != null ? Number(row.roi_d3) : null,
    roi_d7: row.roi_d7 != null ? Number(row.roi_d7) : null,
    roi_d14: row.roi_d14 != null ? Number(row.roi_d14) : null,
    roi_d30: row.roi_d30 != null ? Number(row.roi_d30) : null,
    roi_d60: row.roi_d60 != null ? Number(row.roi_d60) : null,
    roi_d90: row.roi_d90 != null ? Number(row.roi_d90) : null,
    predicted,
  };
}

type RoiField = "roi_d0" | "roi_d1" | "roi_d3" | "roi_d7" | "roi_d14" | "roi_d30" | "roi_d60" | "roi_d90";

function getRoiValue(point: RoiDataPoint, col: RoiField): number | null {
  return point[col];
}

function withRoiValue(point: RoiDataPoint, col: RoiField, value: number, predicted: boolean): RoiDataPoint {
  return {
    ...point,
    [col]: value,
    predicted: { ...point.predicted, [col]: predicted },
  };
}

/** 线性外推预测: 对 null 值根据已有数据做线性回归预测 */
export function applyLinearPrediction(data: RoiDataPoint[]): RoiDataPoint[] {
  if (data.length < 2) return data;

  return (ROI_COLUMNS as RoiField[]).reduce((currentData, col) => {
    // 找到最后一个非null值的索引
    let lastRealIdx = -1;
    for (let i = currentData.length - 1; i >= 0; i--) {
      if (getRoiValue(currentData[i], col) != null) {
        lastRealIdx = i;
        break;
      }
    }

    if (lastRealIdx < 1) return currentData; // 不足2个实际数据点

    // 用最后 N 个实际数据点做线性回归
    const windowSize = Math.min(14, lastRealIdx + 1);
    const points: Array<{ x: number; y: number }> = [];
    for (let i = lastRealIdx; i > lastRealIdx - windowSize && i >= 0; i--) {
      const val = getRoiValue(currentData[i], col);
      if (val != null) {
        points.push({ x: i, y: val });
      }
    }

    if (points.length < 2) return currentData;

    const { slope, intercept } = linearRegression(points);

    return currentData.map((point, idx) => {
      if (idx <= lastRealIdx) return point;
      if (getRoiValue(point, col) != null) return point;

      const predictedVal = Math.max(0, slope * idx + intercept);
      return withRoiValue(point, col, predictedVal, true);
    });
  }, data);
}

function linearRegression(points: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/** 清空所有 ROI 数据 */
export async function clearAllData(): Promise<number> {
  const [result] = await pool.execute("DELETE FROM roi_data");
  return (result as { affectedRows: number }).affectedRows;
}

/** 获取筛选器选项 */
export async function getFilterOptions(): Promise<FilterOptions> {
  const [apps] = await pool.execute<RowDataPacket[]>("SELECT DISTINCT app FROM roi_data ORDER BY app");
  const [countries] = await pool.execute<RowDataPacket[]>("SELECT DISTINCT country FROM roi_data ORDER BY country");
  const [bidTypes] = await pool.execute<RowDataPacket[]>("SELECT DISTINCT bid_type FROM roi_data ORDER BY bid_type");
  const [channels] = await pool.execute<RowDataPacket[]>(
    "SELECT DISTINCT install_channel FROM roi_data ORDER BY install_channel"
  );
  const [dateRange] = await pool.execute<RowDataPacket[]>(
    "SELECT MIN(date) as min_date, MAX(date) as max_date FROM roi_data"
  );

  const formatDate = (d: unknown) => (d instanceof Date ? d.toISOString().split("T")[0] : String(d ?? ""));

  return {
    apps: apps.map((r) => r.app),
    countries: countries.map((r) => r.country),
    bid_types: bidTypes.map((r) => r.bid_type),
    install_channels: channels.map((r) => r.install_channel),
    date_range: {
      min: formatDate(dateRange[0]?.min_date),
      max: formatDate(dateRange[0]?.max_date),
    },
  };
}
