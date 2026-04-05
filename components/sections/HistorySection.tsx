import HistoryChart from "@/components/ui/HistoryChart";
import EmptyState from "@/components/ui/EmptyState";
import {
  cardStyle,
  historyToolbarStyle,
  labelStyle,
  loadingBoxStyle,
  rangeButtonActiveStyle,
  rangeButtonStyle,
  rangeButtonWrapStyle,
  sectionTitleStyle,
  selectStyle,
} from "@/lib/gold/styles";
import type { ChartRange, HistoryResponse } from "@/lib/gold/types";

export default function HistorySection({
  selectedChartKey,
  setSelectedChartKey,
  chartOptions,
  chartRange,
  setChartRange,
  historyLoading,
  historyData,
}: {
  selectedChartKey: string;
  setSelectedChartKey: (value: string) => void;
  chartOptions: Array<{ key: string; label: string }>;
  chartRange: ChartRange;
  setChartRange: (value: ChartRange) => void;
  historyLoading: boolean;
  historyData: HistoryResponse | null;
}) {
  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Historischer Verlauf</h2>

      <div style={historyToolbarStyle}>
        <label style={labelStyle}>
          Produkt
          <select
            value={selectedChartKey}
            onChange={(event) => setSelectedChartKey(event.target.value)}
            style={selectStyle}
          >
            {chartOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div style={rangeButtonWrapStyle}>
          <button
            type="button"
            onClick={() => setChartRange("day")}
            style={{ ...rangeButtonStyle, ...(chartRange === "day" ? rangeButtonActiveStyle : {}) }}
          >
            Tagesansicht
          </button>

          <button
            type="button"
            onClick={() => setChartRange("week")}
            style={{
              ...rangeButtonStyle,
              ...(chartRange === "week" ? rangeButtonActiveStyle : {}),
            }}
          >
            7 Tage
          </button>

          <button
            type="button"
            onClick={() => setChartRange("month")}
            style={{
              ...rangeButtonStyle,
              ...(chartRange === "month" ? rangeButtonActiveStyle : {}),
            }}
          >
            Monat
          </button>
        </div>
      </div>

      {historyLoading ? (
        <div style={loadingBoxStyle}>🔄 Verlauf wird geladen …</div>
      ) : historyData ? (
        <HistoryChart
          points={historyData.points}
          title={historyData.title}
          currency={historyData.currency}
          range={historyData.range}
        />
      ) : (
        <EmptyState text="Keine Verlaufsdaten verfügbar." />
      )}
    </section>
  );
}