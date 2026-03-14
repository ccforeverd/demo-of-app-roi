import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", next);
        const root = document.documentElement;
        root.setAttribute("data-theme-transition", "");
        setTimeout(() => root.removeAttribute("data-theme-transition"), 500);
      }
      return { theme: next };
    }),
}));

export function initTheme(): Theme {
  const theme = getInitialTheme();
  useThemeStore.setState({ theme });
  return theme;
}
