import type { RoiDataPoint } from "@demo-of-app-roi/shared";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";

interface RoiSummaryCardsProps {
  readonly data: RoiDataPoint[];
}

interface CardConfig {
  key: keyof RoiDataPoint;
  label: string;
  period: string;
}

const CARDS: CardConfig[] = [
  { key: "roi_d0", label: "当日 ROI", period: "D0" },
  { key: "roi_d7", label: "7日 ROI", period: "D7" },
  { key: "roi_d30", label: "30日 ROI", period: "D30" },
];

function getLatestValue(
  data: RoiDataPoint[],
  key: keyof RoiDataPoint,
): number | null {
  for (let i = data.length - 1; i >= 0; i--) {
    const val = data[i][key];
    if (val != null) return val as number;
  }
  return null;
}

function getPrevValue(
  data: RoiDataPoint[],
  key: keyof RoiDataPoint,
): number | null {
  let found = false;
  for (let i = data.length - 1; i >= 0; i--) {
    const val = data[i][key];
    if (val != null) {
      if (found) return val as number;
      found = true;
    }
  }
  return null;
}

export function RoiSummaryCards({ data }: RoiSummaryCardsProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-1">
        {CARDS.map(({ key, label, period }) => {
          const latest = getLatestValue(data, key);
          const prev = getPrevValue(data, key);
          const trend =
            latest != null && prev != null
              ? latest > prev
                ? "up"
                : latest < prev
                  ? "down"
                  : "flat"
              : null;

          return (
            <div
              key={period}
              className="shrink-0 rounded-lg border border-border bg-card px-4 py-3 min-w-[140px] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-card-foreground">
                  {latest != null ? `${latest.toFixed(2)}%` : "—"}
                </span>
                {trend === "up" && (
                  <FaArrowTrendUp className="text-green-500 text-sm" />
                )}
                {trend === "down" && (
                  <FaArrowTrendDown className="text-red-500 text-sm" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{period}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
