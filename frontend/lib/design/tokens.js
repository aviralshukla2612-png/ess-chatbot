/**
 * Emperor Nexus — Centralized Enterprise SaaS Design Token System
 * Visual Direction: "Nexus Slate & Royal Indigo"
 *
 * Consumed across JS components, Recharts data visualizations, theme switches,
 * and mirrored 1:1 in CSS custom properties inside `app/globals.css`.
 */

export const DESIGN_TOKENS = {
  meta: {
    name: "Nexus Slate & Royal Indigo",
    version: "2.0.0",
    wcagTarget: "WCAG 2.2 AA",
  },

  colors: {
    light: {
      canvas: "#F8FAFC",
      surface: "#FFFFFF",
      elevated: "#FFFFFF",
      subtle: "#F1F5F9",
      mutedSurface: "#E2E8F0",
      textPrimary: "#0F172A",
      textSecondary: "#334155",
      textMuted: "#64748B",
      borderSubtle: "#E2E8F0",
      borderStrong: "#CBD5E1",
      primary: "#4F46E5",
      primaryHover: "#4338CA",
      primaryActive: "#3730A3",
      primarySoft: "#EEF2FF",
      primaryBorder: "#C7D2FE",
      primaryText: "#4338CA",
      secondary: "#0F172A",
      success: "#059669",
      successBg: "#ECFDF5",
      successBorder: "#A7F3D0",
      successText: "#047857",
      warning: "#D97706",
      warningBg: "#FFFBEB",
      warningBorder: "#FDE68A",
      warningText: "#B45309",
      danger: "#E11D48",
      dangerBg: "#FFF1F2",
      dangerBorder: "#FECDD3",
      dangerText: "#BE123C",
      info: "#0284C7",
      infoBg: "#F0F9FF",
      infoBorder: "#BAE6FD",
      infoText: "#0369A1",
    },
    dark: {
      canvas: "#090D16",
      surface: "#111827",
      elevated: "#161F30",
      subtle: "#1E293B",
      mutedSurface: "#334155",
      textPrimary: "#F8FAFC",
      textSecondary: "#CBD5E1",
      textMuted: "#94A3B8",
      borderSubtle: "#1E293B",
      borderStrong: "#334155",
      primary: "#6366F1",
      primaryHover: "#4F46E5",
      primaryActive: "#4338CA",
      primarySoft: "rgba(99, 102, 241, 0.14)",
      primaryBorder: "rgba(99, 102, 241, 0.32)",
      primaryText: "#818CF8",
      secondary: "#E2E8F0",
      success: "#10B981",
      successBg: "rgba(16, 185, 129, 0.12)",
      successBorder: "rgba(16, 185, 129, 0.28)",
      successText: "#34D399",
      warning: "#F59E0B",
      warningBg: "rgba(245, 158, 11, 0.12)",
      warningBorder: "rgba(245, 158, 11, 0.28)",
      warningText: "#FBBF24",
      danger: "#F43F5E",
      dangerBg: "rgba(244, 63, 94, 0.12)",
      dangerBorder: "rgba(244, 63, 94, 0.28)",
      dangerText: "#FB7185",
      info: "#38BDF8",
      infoBg: "rgba(56, 189, 248, 0.12)",
      infoBorder: "rgba(56, 189, 248, 0.28)",
      infoText: "#7DD3FC",
    },
  },

  charts: {
    primary: "#4F46E5",
    primaryDark: "#6366F1",
    emerald: "#10B981",
    sky: "#0EA5E9",
    amber: "#F59E0B",
    rose: "#F43F5E",
    slate: "#64748B",
    palette: ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#F43F5E", "#64748B"],
  },

  typography: {
    fontSans:
      '"Inter", "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontDisplay: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    fontMono:
      '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    scale: {
      xs: "0.75rem",     // 12px
      sm: "0.8125rem",   // 13px
      base: "0.875rem",  // 14px (dense SaaS default)
      md: "1rem",        // 16px
      lg: "1.125rem",    // 18px
      xl: "1.25rem",     // 20px
      "2xl": "1.5rem",   // 24px
      "3xl": "1.875rem", // 30px
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  spacing: {
    xs: "0.25rem",  // 4px
    sm: "0.5rem",   // 8px
    md: "0.75rem",  // 12px
    lg: "1rem",     // 16px
    xl: "1.5rem",   // 24px
    "2xl": "2rem",  // 32px
    "3xl": "3rem",  // 48px
  },

  radii: {
    xs: "6px",
    sm: "8px",
    md: "10px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    full: "9999px",
  },

  shadows: {
    xs: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
    sm: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
    md: "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
    lg: "0 12px 28px -6px rgba(15, 23, 42, 0.12), 0 4px 10px -4px rgba(15, 23, 42, 0.06)",
    modal: "0 24px 56px -12px rgba(15, 23, 42, 0.28)",
  },

  dimensions: {
    sidebarWidth: "260px",
    headerHeight: "60px",
    controlSm: "32px",
    controlMd: "38px",
    controlLg: "44px",
  },

  transitions: {
    fast: "120ms cubic-bezier(0.16, 1, 0.3, 1)",
    normal: "200ms cubic-bezier(0.16, 1, 0.3, 1)",
    slow: "300ms cubic-bezier(0.16, 1, 0.3, 1)",
  },

  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
};

/**
 * Helper to resolve Recharts axis/grid/tooltip styles cleanly for Light & Dark modes.
 */
export function getChartTheme(isDark = false) {
  const mode = isDark ? DESIGN_TOKENS.colors.dark : DESIGN_TOKENS.colors.light;
  const grid = isDark ? "#1E293B" : "#E2E8F0";
  const axis = isDark ? "#94A3B8" : "#64748B";
  const primary = isDark ? "#6366F1" : "#4F46E5";
  const secondary = "#0EA5E9";
  const tertiary = "#10B981";
  return {
    grid,
    gridStroke: grid,
    axisText: axis,
    axisColor: axis,
    tooltipBg: isDark ? "#161F30" : "#FFFFFF",
    tooltipBorder: isDark ? "#334155" : "#E2E8F0",
    tooltipText: mode.textPrimary,
    tooltipLabel: mode.textMuted,
    primary,
    primaryStroke: primary,
    secondary,
    secondaryStroke: tertiary,
    tertiary,
    tertiaryStroke: secondary,
  };
}

export default DESIGN_TOKENS;
