import { emptyStateStyle } from "@/lib/gold/styles";

export default function EmptyState({ text }: { text: string }) {
  return <div style={emptyStateStyle}>{text}</div>;
}