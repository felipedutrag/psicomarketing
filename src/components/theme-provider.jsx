"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

const STORAGE_KEY = "psicomarketing-theme";

const emptySubscribe = () => () => {};

function useClientTheme() {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === "undefined") return "system";
      return localStorage.getItem(STORAGE_KEY) || "system";
    },
    () => "system"
  );
}

function useSystemTheme() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => {
      if (typeof window === "undefined") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
    () => "light"
  );
}

function applyThemeClass(resolvedTheme, attribute = "class") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (attribute === "class") {
    root.classList.toggle("dark", resolvedTheme === "dark");
  }
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
}) {
  const savedTheme = useClientTheme();
  const systemTheme = useSystemTheme();
  const [overrideTheme, setOverrideTheme] = useState(null);

  const theme = overrideTheme ?? savedTheme ?? defaultTheme;
  const resolvedTheme = theme === "system" ? (enableSystem ? systemTheme : "light") : theme;

  useEffect(() => {
    applyThemeClass(resolvedTheme, attribute);
  }, [attribute, resolvedTheme]);

  const setTheme = useCallback((nextTheme) => {
    const allowed = nextTheme === "light" || nextTheme === "dark" || nextTheme === "system";
    if (!allowed) return;
    setOverrideTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
