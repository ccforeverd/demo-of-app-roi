import { create } from "zustand";
import type { DisplayMode, YAxisScale } from "@demo-of-app-roi/shared";

interface RoiStoreState {
  readonly app: string;
  readonly country: string;
  readonly bidType: string;
  readonly installChannel: string;
  readonly displayMode: DisplayMode;
  readonly yAxisScale: YAxisScale;
}

interface RoiStoreActions {
  setApp: (app: string) => void;
  setCountry: (country: string) => void;
  setBidType: (bidType: string) => void;
  setInstallChannel: (channel: string) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setYAxisScale: (scale: YAxisScale) => void;
}

export const useRoiStore = create<RoiStoreState & RoiStoreActions>((set) => ({
  app: "",
  country: "",
  bidType: "",
  installChannel: "",
  displayMode: "moving_average",
  yAxisScale: "log",

  setApp: (app) => set({ app }),
  setCountry: (country) => set({ country }),
  setBidType: (bidType) => set({ bidType }),
  setInstallChannel: (channel) => set({ installChannel: channel }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setYAxisScale: (yAxisScale) => set({ yAxisScale }),
}));
