import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createThemeFactory } from "./factories/ThemeFactory";

const THEME_STORAGE_KEY = "taskflow-theme";
const ThemeContext = createContext(null);

function resolveInitialTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function applyThemeVariables(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.id;

  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(resolveInitialTheme);

  const theme = useMemo(() => {
    const factory = createThemeFactory(mode);
    return factory.createTheme();
  }, [mode]);

  useEffect(() => {
    applyThemeVariables(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }, [theme]);

  const value = useMemo(
    () => ({
      mode,
      theme,
      isDark: mode === "dark",
      toggleTheme: () => setMode((current) => (current === "dark" ? "light" : "dark")),
    }),
    [mode, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
