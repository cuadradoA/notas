export class ThemeFactory {
  createTheme() {
    throw new Error("createTheme must be implemented");
  }
}

export class LightThemeFactory extends ThemeFactory {
  createTheme() {
    return {
      id: "light",
      label: "Modo oscuro",
      icon: "moon",
      variables: {
        "--app-bg": "#e9e4df",
        "--app-shell": "#fffdf9",
        "--app-shell-strong": "#f6f1eb",
        "--app-surface": "#ffffff",
        "--app-surface-soft": "#f4efe8",
        "--app-surface-muted": "#eee7de",
        "--app-surface-contrast": "#1f1d1a",
        "--app-border": "rgba(78, 59, 40, 0.10)",
        "--app-border-strong": "rgba(78, 59, 40, 0.18)",
        "--app-text": "#1f2937",
        "--app-text-soft": "#64748b",
        "--app-text-muted": "#94a3b8",
        "--app-primary": "#2954c6",
        "--app-primary-soft": "rgba(41, 84, 198, 0.12)",
        "--app-accent": "#ef8f00",
        "--app-danger": "#d34c52",
        "--app-success": "#1f9d72",
        "--app-shadow": "0 28px 80px rgba(148, 126, 99, 0.18)",
        "--column-blue": "#dcefff",
        "--column-pink": "#ffd9df",
        "--column-yellow": "#fff4c5",
        "--column-mint": "#ddf5eb",
        "--task-yellow": "#f8eb7d",
        "--task-pink": "#f7b3bb",
        "--task-blue": "#79bae8",
        "--task-mint": "#9fd7c2",
        "--task-overdue": "#f3c1c8",
        "--tint-text": "rgba(17, 24, 39, 0.92)",
        "--tint-text-soft": "rgba(17, 24, 39, 0.72)",
        "--tint-text-muted": "rgba(17, 24, 39, 0.58)",
        "--tint-border": "rgba(17, 24, 39, 0.12)",
        "--tint-surface": "rgba(255, 255, 255, 0.45)",
      },
    };
  }
}

export class DarkThemeFactory extends ThemeFactory {
  createTheme() {
    return {
      id: "dark",
      label: "Modo claro",
      icon: "sun",
      variables: {
        "--app-bg": "#121725",
        "--app-shell": "#171d2c",
        "--app-shell-strong": "#1d2435",
        "--app-surface": "#222a3d",
        "--app-surface-soft": "#1b2233",
        "--app-surface-muted": "#2b3448",
        "--app-surface-contrast": "#0d1320",
        "--app-border": "rgba(255, 255, 255, 0.08)",
        "--app-border-strong": "rgba(255, 255, 255, 0.16)",
        "--app-text": "#f7f8fb",
        "--app-text-soft": "#c1cad8",
        "--app-text-muted": "#8d99af",
        "--app-primary": "#8ab4ff",
        "--app-primary-soft": "rgba(138, 180, 255, 0.18)",
        "--app-accent": "#ffc857",
        "--app-danger": "#ff7a85",
        "--app-success": "#53d6a4",
        "--app-shadow": "0 28px 90px rgba(0, 0, 0, 0.34)",
        "--column-blue": "#294e73",
        "--column-pink": "#6d4054",
        "--column-yellow": "#706234",
        "--column-mint": "#315c55",
        "--task-yellow": "#6b5f1f",
        "--task-pink": "#6f4458",
        "--task-blue": "#274f72",
        "--task-mint": "#24534b",
        "--task-overdue": "#6a3e4a",
        "--tint-text": "rgba(255, 255, 255, 0.96)",
        "--tint-text-soft": "rgba(241, 245, 249, 0.84)",
        "--tint-text-muted": "rgba(226, 232, 240, 0.70)",
        "--tint-border": "rgba(255, 255, 255, 0.18)",
        "--tint-surface": "rgba(255, 255, 255, 0.14)",
      },
    };
  }
}

export function createThemeFactory(mode) {
  if (mode === "light") {
    return new LightThemeFactory();
  }

  return new DarkThemeFactory();
}
 