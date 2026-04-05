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
  utilityButtonActiveStyle,
  utilityButtonStyle,
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
  favoriteChartKeys,
  showOnlyFavoriteCharts,
  setShowOnlyFavoriteCharts,
}: {
  selectedChartKey: string;
  setSelectedChartKey: (value: string) => void;
  chartOptions: Array<{ key: string; label: string }>;
  chartRange: ChartRange;
  setChartRange: (value: ChartRange) => void;
  historyLoading: boolean;
  historyData: HistoryResponse | null;
  favoriteChartKeys: string[];
  showOnlyFavoriteCharts: boolean;
  setShowOnlyFavoriteCharts: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const visibleChartOptions = showOnlyFavoriteCharts
    ? chartOptions.filter((option) => favoriteChartKeys.includes(option.key))
    : chartOptions;

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
            {visibleChartOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <button
            type="button"
            onClick={() => setShowOnlyFavoriteCharts((prev) => !prev)}
            style={{
              ...utilityButtonStyle,
              ...(showOnlyFavoriteCharts ? utilityButtonActiveStyle : {}),
            }}
          >
            {showOnlyFavoriteCharts ? "Nur Favoriten im Chart: AN" : "Nur Favoriten im Chart"}
          </button>
        </div>

        <div style={rangeButtonWrapStyle}>
          <button
            type="button"
            onClick={() => setChartRange("day")}
            style={{ ...rangeButtonStyle, ...(chartRange === "day" ? rangeButtonActiveStyle : {}) }}
          >
            24 Stunden
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
            30 Tage
          </button>
        </div>
      </div>

      {visibleChartOptions.length === 0 ? (
        <EmptyState text="Keine passenden Chart-Produkte verfügbar." />
      ) : historyLoading ? (
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