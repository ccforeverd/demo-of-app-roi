import type { RoiDataPoint } from "@demo-of-app-roi/shared";

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
              className="flex-shrink-0 rounded-lg border border-border bg-card px-4 py-3 min-w-[140px]"
            >
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-card-foreground">
                  {latest != null ? `${latest.toFixed(2)}%` : "—"}
                </span>
                {trend === "up" && (
                  <span className="text-green-500 text-sm font-medium mb-0.5">
                    ↑
                  </span>
                )}
                {trend === "down" && (
                  <span className="text-red-500 text-sm font-medium mb-0.5">
                    ↓
                  </span>
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
