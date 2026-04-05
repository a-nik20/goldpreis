import { getTrendArrow, getTrendColor } from "@/lib/gold/history";

export default function DayDiffCell({
  text,
  value,
}: {
  text: string;
  value: number | null;
}) {
  const color = getTrendColor(value);
  const arrow = getTrendArrow(value);

  return (
    <span
      style={{
        color,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {text === "–" ? (
        <span>–</span>
      ) : (
        <>
          <span>{arrow}</span>
          <span>{text}</span>
        </>
      )}
    </span>
  );
}