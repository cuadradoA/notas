class BaseThemeFactory {
  createTheme() {
    return {
      mode: this.getMode(),
      documentTheme: this.getDocumentTheme(),
      palette: this.createPalette(),
      layout: this.createLayout(),
    };
  }
}

export class LightThemeFactory extends BaseThemeFactory {
  getMode() {
    return "light";
  }

  getDocumentTheme() {
    return "light";
  }

  createPalette() {
    return {
      shell: "theme-app-shell",
      surface: "theme-surface",
      softSurface: "theme-surface-soft",
      mutedSurface: "theme-surface-muted",
      card: "theme-card",
      text: "theme-text-main",
      mutedText: "theme-text-muted",
      softText: "theme-text-soft",
      input: "theme-input",
      button: "theme-button",
      buttonPrimary: "theme-button theme-button-primary",
      buttonSoft: "theme-button theme-button-soft",
      badge: "theme-badge",
      success: "theme-success",
      warning: "theme-warning",
      danger: "theme-danger",
    };
  }

  createLayout() {
    return {
      appBackground: "bg-transparent",
    };
  }
}

export class DarkThemeFactory extends LightThemeFactory {
  getMode() {
    return "dark";
  }

  getDocumentTheme() {
    return "dark";
  }
}

export function createThemeFactory(mode) {
  return mode === "dark" ? new DarkThemeFactory() : new LightThemeFactory();
}
