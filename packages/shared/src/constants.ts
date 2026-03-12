/** 移动平均天数 */
export const MOVING_AVERAGE_DAYS = 7;

/** 图表颜色配置 - 8条线对应8个ROI维度 */
export const ROI_CHART_COLORS: Record<string, string> = {
  roi_d0: "#5470c6",
  roi_d1: "#91cc75",
  roi_d3: "#fac858",
  roi_d7: "#ee6666",
  roi_d14: "#73c0de",
  roi_d30: "#fc8452",
  roi_d60: "#9a60b4",
  roi_d90: "#ea7ccc",
};

/** 100% 回本基准线颜色 */
export const BREAKEVEN_LINE_COLOR = "#ff0000";

/** 默认安装渠道 */
export const DEFAULT_INSTALL_CHANNEL = "Apple";

/** API 基础路径 */
export const API_BASE_PATH = "/api/roi";
