import type { HistoryPoint } from "@/lib/gold/types";

export function getTrendColor(value: number | null) {
  if (value === null || Number.isNaN(value)) return "#6b7280";
  if (value > 0) return "#16a34a";
  if (value < 0) return "#dc2626";
  return "#6b7280";
}

export function getTrendArrow(value: number | null) {
  if (value === null || Number.isNaN(value)) return "";
  if (value > 0) return "▲";
  if (value < 0) return "▼";
  return "→";
}

export function buildSmoothPath(
  points: HistoryPoint[],
  width: number,
  height: number,
  padding: number
) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const y = height / 2;
    return `M ${padding} ${y} L ${width - padding} ${y}`;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((point, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const current = coords[i];
    const midX = (prev.x + current.x) / 2;
    path += ` Q ${midX} ${prev.y} ${current.x} ${current.y}`;
  }

  return path;
}

export function getDayAxisLabels(points: HistoryPoint[]) {
  const uniqueHours: string[] = [];

  for (const point of points) {
    const hour = `${point.label.slice(0, 2)}:00`;
    if (!uniqueHours.includes(hour)) {
      uniqueHours.push(hour);
    }
  }

  return uniqueHours.slice(-4);
}

export function getWeekAxisLabels(points: HistoryPoint[]) {
  return points.map((point) => point.label);
}

export function getMonthAxisLabels(points: HistoryPoint[]) {
  if (points.length <= 6) return points.map((point) => point.label);

  const result: string[] = [];
  const step = Math.max(1, Math.floor(points.length / 6));

  for (let i = 0; i < points.length; i += step) {
    result.push(points[i].label);
  }

  const last = points[points.length - 1]?.label;
  if (last && result[result.length - 1] !== last) {
    result.push(last);
  }

  return result.slice(0, 6);
}