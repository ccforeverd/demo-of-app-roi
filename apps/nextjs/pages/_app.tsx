import "../styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { initTheme, useThemeStore } from "../store/useThemeStore";
import { Toast } from "../components/Toast";

function ThemeApplier() {
  const { theme } = useThemeStore();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    const theme = initTheme();
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <Component {...pageProps} />
      <Toast />
    </QueryClientProvider>
  );
}
