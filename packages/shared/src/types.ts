/** ROI 时间维度 */
export const ROI_PERIODS = [0, 1, 3, 7, 14, 30, 60, 90] as const;
export type RoiPeriod = (typeof ROI_PERIODS)[number];

/** ROI 时间维度标签 */
export const ROI_PERIOD_LABELS: Record<RoiPeriod, string> = {
  0: "当日",
  1: "1日",
  3: "3日",
  7: "7日",
  14: "14日",
  30: "30日",
  60: "60日",
  90: "90日",
};

/** 数据库中的 ROI 记录 */
export interface RoiRecord {
  id: number;
  date: string; // YYYY-MM-DD
  app: string;
  bid_type: string;
  country: string;
  install_channel: string;
  install_count: number;
  roi_d0: number | null;
  roi_d1: number | null;
  roi_d3: number | null;
  roi_d7: number | null;
  roi_d14: number | null;
  roi_d30: number | null;
  roi_d60: number | null;
  roi_d90: number | null;
}

/** API 返回的 ROI 数据点 (用于图表) */
export interface RoiDataPoint {
  date: string;
  roi_d0: number | null;
  roi_d1: number | null;
  roi_d3: number | null;
  roi_d7: number | null;
  roi_d14: number | null;
  roi_d30: number | null;
  roi_d60: number | null;
  roi_d90: number | null;
  /** 各维度是否为预测值 */
  predicted: Record<string, boolean>;
}

/** 查询筛选参数 */
export interface RoiQueryParams {
  app?: string;
  country?: string;
  bid_type?: string;
  install_channel?: string;
  start_date?: string;
  end_date?: string;
}

/** 筛选器可选项 */
export interface FilterOptions {
  apps: string[];
  countries: string[];
  bid_types: string[];
  install_channels: string[];
  date_range: {
    min: string;
    max: string;
  };
}

/** API 响应信封 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/** 数据显示模式 */
export type DisplayMode = "moving_average" | "raw";

/** Y轴刻度类型 */
export type YAxisScale = "linear" | "log";

/** CSV 导入结果 */
export interface ImportResult {
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  errors: string[];
}
