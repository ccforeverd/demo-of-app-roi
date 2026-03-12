import React from "react";
import { RadioGroup } from "./ui/radio-group";
import { useRoiStore } from "../store/useRoiStore";
import type { DisplayMode, YAxisScale } from "@demo-of-app-roi/shared";

const DISPLAY_MODE_OPTIONS = [
  { label: "显示移动平均值", value: "moving_average" as DisplayMode },
  { label: "显示原始数据", value: "raw" as DisplayMode },
] as const;

const Y_AXIS_OPTIONS = [
  { label: "线性刻度", value: "linear" as YAxisScale },
  { label: "对数刻度", value: "log" as YAxisScale },
] as const;

export function DisplayControls() {
  const { displayMode, yAxisScale, setDisplayMode, setYAxisScale } = useRoiStore();

  return (
    <div className="flex items-center justify-center gap-12 rounded-lg border border-border bg-card p-4">
      <RadioGroup
        groupLabel="数据显示模式"
        options={DISPLAY_MODE_OPTIONS}
        value={displayMode}
        onChange={setDisplayMode}
      />
      <RadioGroup
        groupLabel="Y轴刻度"
        options={Y_AXIS_OPTIONS}
        value={yAxisScale}
        onChange={setYAxisScale}
      />
    </div>
  );
}
