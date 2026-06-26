/**
 * Buggee Design System — Theme Tokens
 * Dark  : Black background  + Golden Yellow accent (#F5C518)
 * Light : White background  + Deep Gold accent    (#D4A017)
 */

import { Platform } from 'react-native';

// ─── Accent ──────────────────────────────────────────────────────────────────
export const YELLOW_DARK  = '#FCD451'; // golden yellow accent shade
export const YELLOW_LIGHT = '#FCD451'; // golden yellow accent shade

// ─── Dark palette ────────────────────────────────────────────────────────────
export const darkTheme = {
  // Backgrounds
  bg: '#000000',   // root screen bg  (pure black)
  surface: '#0D0D0D',   // slightly lifted surface
  card: '#161616',   // card / list-item bg
  cardAlt: '#1F1F1F',   // alternate card (booking rows)

  // Accent
  accent: YELLOW_DARK,
  accentDim: 'rgba(252, 212, 81, 0.15)',
  accentMid: 'rgba(252, 212, 81, 0.30)',

  // Text
  text: '#FFFFFF',
  textSub: '#A0A0A0',   // secondary / caption
  textMuted: '#606060',   // placeholder / disabled

  // Borders
  border: '#262626',
  borderSub: 'rgba(255,255,255,0.05)',

  // Status
  danger: '#EF4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  success: '#22C55E',

  // Icon default
  icon: YELLOW_DARK,
  iconMuted: '#808080',

  // Overlay
  overlay: 'rgba(0,0,0,0.85)',
  modalBg: '#0E0E0E',

  // Map Location Marker & Accuracy Circle (refined for a premium golden aura in dark mode)
  mapMarkerCore: '#FCD451',
  mapMarkerInner: 'rgba(252, 212, 81, 0.25)',
  mapMarkerOuter: 'rgba(252, 212, 81, 0.12)',
  mapCircleStroke: 'rgba(252, 212, 81, 0.35)',
  mapCircleFill: 'rgba(252, 212, 81, 0.06)',
} as const;

// ─── Light palette ───────────────────────────────────────────────────────────
export const lightTheme = {
  // Backgrounds
  bg: '#FFFFFF',   // root screen bg (pure white)
  surface: '#F8F9FA',   // slightly lifted surface
  card: '#FFFFFF',   // card / list-item bg
  cardAlt: '#F1F3F5',   // alternate card

  // Accent
  accent: YELLOW_LIGHT,
  accentDim: 'rgba(252, 212, 81, 0.12)',
  accentMid: 'rgba(252, 212, 81, 0.22)',

  // Text
  text: '#121212',   // main readable text
  textSub: '#5F6368',   // secondary / caption
  textMuted: '#9AA0A6',   // placeholder / disabled

  // Borders
  border: '#E8EAED',
  borderSub: 'rgba(0,0,0,0.04)',

  // Status
  danger: '#DC2626',
  dangerDim: 'rgba(220,38,38,0.1)',
  success: '#16A34A',

  // Icon default
  icon: YELLOW_LIGHT,
  iconMuted: '#BDC1C6',

  // Overlay
  overlay: 'rgba(0,0,0,0.45)',
  modalBg: '#FFFFFF',

  // Map Location Marker & Accuracy Circle (darker gold-yellow for enhanced visibility on light map)
  mapMarkerCore: '#B57C00',
  mapMarkerInner: 'rgba(181, 124, 0, 0.25)',
  mapMarkerOuter: 'rgba(181, 124, 0, 0.12)',
  mapCircleStroke: 'rgba(181, 124, 0, 0.40)',
  mapCircleFill: 'rgba(181, 124, 0, 0.08)',
} as const;

export type AppTheme = {
  readonly [K in keyof typeof darkTheme]: string;
};

// ─── Legacy Colors (kept for themed-text / themed-view compatibility) ────────
export const Colors = {
  light: {
    text: lightTheme.text,
    background: lightTheme.bg,
    tint: lightTheme.accent,
    icon: lightTheme.icon,
    tabIconDefault: lightTheme.iconMuted,
    tabIconSelected: lightTheme.accent,
  },
  dark: {
    text: darkTheme.text,
    background: darkTheme.bg,
    tint: darkTheme.accent,
    icon: darkTheme.icon,
    tabIconDefault: darkTheme.iconMuted,
    tabIconSelected: darkTheme.accent,
  },
};

// ─── Fonts ───────────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
