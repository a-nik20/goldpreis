import { getTrendArrow, getTrendColor } from "@/lib/gold/history";

export default function InlinePrice({
  value,
  diffText,
  diffValue,
}: {
  value: string;
  diffText: string;
  diffValue: number | null;
}) {
  const color = getTrendColor(diffValue);
  const arrow = getTrendArrow(diffValue);

  return (
    <span style={{ fontWeight: 700 }}>
      <span>{value}</span>
      <span
        style={{
          marginLeft: "8px",
          color,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        ({diffText === "–" ? "–" : `${arrow} ${diffText}`})
      </span>
    </span>
  );
}