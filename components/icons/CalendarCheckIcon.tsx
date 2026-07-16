/**
 * CalendarCheckIcon - Custom calendar with checkmark icon
 * Premium, minimalist design for bottom tab navigation
 * Optimized for 24×24 px with consistent visual weight
 */
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface CalendarCheckIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export default function CalendarCheckIcon({
  size = 24,
  color = '#8E8E93',
  filled = false,
}: CalendarCheckIconProps) {
  const strokeWidth = filled ? 2.2 : 1.8;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Calendar body - rounded rectangle */}
      <Rect
        x={3}
        y={5}
        width={18}
        height={16}
        rx={3}
        ry={3}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Top bar / header line */}
      <Path
        d="M3 9.5H21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Left calendar ring */}
      <Path
        d="M8 2.5V6.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Right calendar ring */}
      <Path
        d="M16 2.5V6.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Checkmark - centered, rounded */}
      <Path
        d="M8.5 14.5L10.75 16.75L15.5 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
