"use client";

import { useMemo, useState } from "react";
import {
  buildSmoothPath,
  getDayAxisLabels,
  getMonthAxisLabels,
  getTrendColor,
  getWeekAxisLabels,
} from "@/lib/gold/history";
import {
  chartOuterStyle,
  chartTooltipStyle,
  historyHeaderStyle,
  historyLabelItemStyle,
  historyLabelsStyle,
  historyStatsStyle,
  historyWrapStyle,
} from "@/lib/gold/styles";
import type { ChartRange, HistoryPoint } from "@/lib/gold/types";

export default function HistoryChart({
  points,
  title,
  currency,
  range,
}: {
  points: HistoryPoint[];
  title: string;
  currency: "EUR";
  range: ChartRange;
}) {
  const width = 920;
  const height = 280;
  const padding = 28;
  const path = buildSmoothPath(points, width, height, padding);

  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const latest = values.length ? values[values.length - 1] : 0;
  const first = values.length ? values[0] : 0;
  const diff = latest - first;

  const formatter = new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  const axisLabels =
    range === "day"
      ? getDayAxisLabels(points)
      : range === "week"
      ? getWeekAxisLabels(points)
      : getMonthAxisLabels(points);

  const chartPoints = useMemo(() => {
    if (points.length === 0) return [];
    const rangeValue = max - min || 1;

    return points.map((point, index) => {
      const x = padding + (index / (points.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((point.value - min) / rangeValue) * (height - padding * 2);
      return { ...point, x, y };
    });
  }, [points, min, max]);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const minPoint =
    chartPoints.length > 0
      ? chartPoints.reduce((prev, curr) => (curr.value < prev.value ? curr : prev))
      : null;

  const maxPoint =
    chartPoints.length > 0
      ? chartPoints.reduce((prev, curr) => (curr.value > prev.value ? curr : prev))
      : null;

  const lastPoint = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1] : null;

  return (
    <div style={historyWrapStyle}>
      <div style={historyHeaderStyle}>
        <div>
          <strong>{title}</strong>
        </div>

        <div style={historyStatsStyle}>
          <span>Min: {formatter.format(min)}</span>
          <span>Max: {formatter.format(max)}</span>
          <span style={{ color: getTrendColor(diff) }}>
            Verlauf: {diff >= 0 ? "+" : ""}
            {formatter.format(diff)}
          </span>
        </div>
      </div>

      {points.length === 0 ? (
        <div
          style={{
            padding: "18px",
            borderRadius: "14px",
            backgroundColor: "#f9fafb",
            color: "#6b7280",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Für diesen Zeitraum sind noch keine Verlaufsdaten vorhanden.
        </div>
      ) : (
        <>
          <div style={chartOuterStyle}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{ width: "100%", minWidth: "720px", height: "300px", display: "block" }}
              role="img"
              aria-label={title}
            >
              <line x1="28" y1="28" x2="28" y2="252" stroke="#d1d5db" strokeWidth="1" />
              <line x1="28" y1="252" x2="892" y2="252" stroke="#d1d5db" strokeWidth="1" />

              <path
                d={path}
                fill="none"
                stroke={diff >= 0 ? "#16a34a" : "#dc2626"}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {minPoint && (
                <circle
                  cx={minPoint.x}
                  cy={minPoint.y}
                  r={5}
                  fill="#dc2626"
                  opacity={0.85}
                />
              )}

              {maxPoint && (
                <circle
                  cx={maxPoint.x}
                  cy={maxPoint.y}
                  r={5}
                  fill="#16a34a"
                  opacity={0.85}
                />
              )}

              {lastPoint && (
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r={7}
                  fill="#111827"
                  opacity={0.95}
                />
              )}

              {chartPoints.map((point, index) => (
                <g key={`${point.label}-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredIndex === index ? 6 : 3.5}
                    fill={hoveredIndex === index ? "#111827" : "#374151"}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: "pointer" }}
                  />
                </g>
              ))}
            </svg>

            {hoveredIndex !== null && chartPoints[hoveredIndex] && (
              <div style={chartTooltipStyle}>
                <strong>{chartPoints[hoveredIndex].label}</strong>
                <div>{formatter.format(chartPoints[hoveredIndex].value)}</div>
              </div>
            )}
          </div>

          <div style={historyLabelsStyle}>
            {axisLabels.map((label, index) => (
              <span key={`${label}-${index}`} style={historyLabelItemStyle}>
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}