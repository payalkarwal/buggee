/**
 * Buggee Design System — Theme Tokens
 * Dark  : Black background  + Hot Pink accent (#FF4F8B)
 * Light : White background  + Blush Pink accent (#FF6B9D)
 */

import { Platform } from 'react-native';

// ─── Accent ──────────────────────────────────────────────────────────────────
export const PINK_DARK  = '#FF4F8B'; // Hot Rose / Neon Rose accent
export const PINK_LIGHT = '#FF6B9D'; // Blush Pink / Bubblegum Pink accent

// ─── Dark palette ────────────────────────────────────────────────────────────
export const darkTheme = {
  // Backgrounds
  bg: '#121212',   // root screen bg (Midnight Black)
  surface: '#1E1E1E',   // slightly lifted surface (Dark Charcoal)
  card: '#1E1E1E',   // card / list-item bg (Dark Charcoal)
  cardAlt: '#2A2A2A',   // alternate card (booking rows)

  // Accent
  accent: PINK_DARK,
  accentDim: 'rgba(255, 79, 139, 0.15)',
  accentMid: 'rgba(255, 79, 139, 0.30)',

  // Text
  text: '#F5F5F5',   // Soft White
  textSub: '#A0A0A0',   // secondary / caption
  textMuted: '#606060',   // placeholder / disabled

  // Borders
  border: '#2A2A2A',
  borderSub: 'rgba(255,255,255,0.05)',

  // Status
  danger: '#EF4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  success: '#22C55E',

  // Icon default
  icon: PINK_DARK,
  iconMuted: '#808080',

  // Overlay
  overlay: 'rgba(0,0,0,0.40)',
  overlayDark: 'rgba(0,0,0,0.60)',
  modalBg: '#1E1E1E',

  // Map Location Marker & Accuracy Circle (refined for a premium pink aura in dark mode)
  mapMarkerCore: '#FF4F8B',
  mapMarkerInner: 'rgba(255, 79, 139, 0.25)',
  mapMarkerOuter: 'rgba(255, 79, 139, 0.12)',
  mapCircleStroke: 'rgba(255, 79, 139, 0.35)',
  mapCircleFill: 'rgba(255, 79, 139, 0.06)',
} as const;

// ─── Light palette ───────────────────────────────────────────────────────────
export const lightTheme = {
  // Backgrounds
  bg: '#FFFFFF',   // root screen bg (Pure White)
  surface: '#FFE6F0',   // slightly lifted surface (Rose Mist / Baby Pink)
  card: '#FFFFFF',   // card / list-item bg (Pure White)
  cardAlt: '#FFF0F7',   // alternate card (lighter pink tint)

  // Accent
  accent: PINK_LIGHT,
  accentDim: 'rgba(255, 107, 157, 0.12)',
  accentMid: 'rgba(255, 107, 157, 0.22)',

  // Text
  text: '#333333',   // main readable text (Charcoal Black)
  textSub: '#5F6368',   // secondary / caption
  textMuted: '#9AA0A6',   // placeholder / disabled

  // Borders
  border: '#FFD4E5',   // soft pink border
  borderSub: 'rgba(0,0,0,0.04)',

  // Status
  danger: '#DC2626',
  dangerDim: 'rgba(220,38,38,0.1)',
  success: '#16A34A',

  // Icon default
  icon: PINK_LIGHT,
  iconMuted: '#BDC1C6',

  // Overlay
  overlay: 'rgba(0,0,0,0.35)',
  overlayDark: 'rgba(0,0,0,0.55)',
  modalBg: '#FFFFFF',

  // Map Location Marker & Accuracy Circle (darker pink for enhanced visibility on light map)
  mapMarkerCore: '#E91E63',
  mapMarkerInner: 'rgba(233, 30, 99, 0.25)',
  mapMarkerOuter: 'rgba(233, 30, 99, 0.12)',
  mapCircleStroke: 'rgba(233, 30, 99, 0.40)',
  mapCircleFill: 'rgba(233, 30, 99, 0.08)',
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
