"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TabMode = "ref" | "market";
type LegalTab = "none" | "impressum" | "disclaimer" | "calculation";
type SortKey = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc";
type ChartRange = "day" | "week" | "month";

type SingleRow = {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  liveDiffText: string;
  liveDiffValue: number | null;
  dayDiffText: string;
  dayDiffValue: number | null;
  favoriteKey: string;
  chartKey: string;
};

type DualRow = {
  id: string;
  name: string;
  priceEur: string;
  priceEurValue: number;
  priceTry: string;
  priceTryValue: number;
  liveDiffTextEur: string;
  liveDiffValueEur: number | null;
  liveDiffTextTry: string;
  liveDiffValueTry: number | null;
  dayDiffText: string;
  dayDiffValue: number | null;
  favoriteKey: string;
  chartKey: string;
};

type PricesResponse = {
  refGeneral: SingleRow[];
  refAustria: SingleRow[];
  refTurkey: DualRow[];
  marketGeneral: SingleRow[];
  marketAustria: SingleRow[];
  marketTurkey: DualRow[];
  updatedAt: string;
  statusText: string;
};

type HistoryPoint = {
  label: string;
  value: number;
};

type HistoryResponse = {
  chartKey: string;
  range: ChartRange;
  title: string;
  currency: "EUR";
  points: HistoryPoint[];
};

type CalculatorPreset = {
  label: string;
  mode: TabMode;
  karat: 22 | 24;
  weight: string;
  currency: "EUR" | "TRY";
};

const REFRESH_INTERVAL_MS = 15000;
const FAVORITES_KEY = "goldpreis_favorites_v5";

const CALCULATOR_PRESETS: CalculatorPreset[] = [
  { label: "Keine Vorlage", mode: "ref", karat: 24, weight: "10", currency: "EUR" },
  { label: "Gold 1 g (24K Spotpreis)", mode: "ref", karat: 24, weight: "1", currency: "EUR" },
  { label: "Goldbarren 5 g", mode: "market", karat: 24, weight: "5", currency: "EUR" },
  { label: "Goldbarren 10 g", mode: "market", karat: 24, weight: "10", currency: "EUR" },
  { label: "Goldbarren 50 g", mode: "market", karat: 24, weight: "50", currency: "EUR" },
  { label: "Goldbarren 100 g", mode: "market", karat: 24, weight: "100", currency: "EUR" },
  { label: "Wiener Philharmoniker 1 oz", mode: "market", karat: 24, weight: "31.1034768", currency: "EUR" },
  { label: "Çeyrek Altın (1,75 g)", mode: "ref", karat: 24, weight: "1.75", currency: "EUR" },
  { label: "Yarım Altın (3,50 g)", mode: "ref", karat: 24, weight: "3.5", currency: "EUR" },
  { label: "Tam Altın (7,00 g)", mode: "ref", karat: 24, weight: "7", currency: "EUR" },
  { label: "Reşat Altın (7,20 g)", mode: "ref", karat: 24, weight: "7.2", currency: "EUR" },
  { label: "Gremse Altın (17,50 g)", mode: "ref", karat: 24, weight: "17.5", currency: "EUR" },
  { label: "Große Reşat Gold (36,00 g)", mode: "ref", karat: 24, weight: "36", currency: "EUR" },
  { label: "Gold-Armreif 10 g (22 Ayar)", mode: "ref", karat: 22, weight: "10", currency: "EUR" },
  { label: "Gold-Armreif 15 g (22 Ayar)", mode: "ref", karat: 22, weight: "15", currency: "EUR" },
  { label: "Gold-Armreif 20 g (22 Ayar)", mode: "ref", karat: 22, weight: "20", currency: "EUR" },
];

function normalizeSearchText(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTrendColor(value: number | null) {
  if (value === null || Number.isNaN(value)) return "#6b7280";
  if (value > 0) return "#16a34a";
  if (value < 0) return "#dc2626";
  return "#6b7280";
}

function getTrendArrow(value: number | null) {
  if (value === null || Number.isNaN(value)) return "";
  if (value > 0) return "▲";
  if (value < 0) return "▼";
  return "→";
}

function buildPath(points: HistoryPoint[], width: number, height: number, padding: number) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const y = height / 2;
    return `M ${padding} ${y} L ${width - padding} ${y}`;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((point.value - min) / range) * (height - padding * 2);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function getDayAxisLabels(points: HistoryPoint[]) {
  const uniqueHours: string[] = [];

  for (const point of points) {
    const hour = `${point.label.slice(0, 2)}:00`;
    if (!uniqueHours.includes(hour)) {
      uniqueHours.push(hour);
    }
  }

  return uniqueHours.slice(-4);
}

function getWeekAxisLabels(points: HistoryPoint[]) {
  return points.map((point) => point.label);
}

function getMonthAxisLabels(points: HistoryPoint[]) {
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

function InlinePrice({
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

function DayDiffCell({
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

function FavoriteButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...favoriteButtonStyle,
        ...(active ? favoriteButtonActiveStyle : {}),
      }}
      aria-label={active ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      title={active ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}

function HistoryChart({
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
  const path = buildPath(points, width, height, padding);

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
        <div style={emptyStateStyle}>Für diesen Zeitraum sind noch keine Verlaufsdaten vorhanden.</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{ width: "100%", minWidth: "720px", height: "280px", display: "block" }}
              role="img"
              aria-label={title}
            >
              <line x1="28" y1="28" x2="28" y2="252" stroke="#d1d5db" strokeWidth="1" />
              <line x1="28" y1="252" x2="892" y2="252" stroke="#d1d5db" strokeWidth="1" />
              <path d={path} fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
            </svg>
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

function EmptyState({ text }: { text: string }) {
  return <div style={emptyStateStyle}>{text}</div>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabMode>("ref");
  const [legalTab, setLegalTab] = useState<LegalTab>("none");

  const [refGeneral, setRefGeneral] = useState<SingleRow[]>([]);
  const [refAustria, setRefAustria] = useState<SingleRow[]>([]);
  const [refTurkey, setRefTurkey] = useState<DualRow[]>([]);
  const [marketGeneral, setMarketGeneral] = useState<SingleRow[]>([]);
  const [marketAustria, setMarketAustria] = useState<SingleRow[]>([]);
  const [marketTurkey, setMarketTurkey] = useState<DualRow[]>([]);

  const [updatedAt, setUpdatedAt] = useState("");
  const [statusText, setStatusText] = useState("Bereit");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [backgroundUpdating, setBackgroundUpdating] = useState(false);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [chartRange, setChartRange] = useState<ChartRange>("day");
  const [selectedChartKey, setSelectedChartKey] = useState("");
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [calculatorMode, setCalculatorMode] = useState<TabMode>("ref");
  const [calculatorKarat, setCalculatorKarat] = useState<22 | 24>(24);
  const [calculatorWeight, setCalculatorWeight] = useState("10");
  const [calculatorCurrency, setCalculatorCurrency] = useState<"EUR" | "TRY">("EUR");
  const [calculatorPreset, setCalculatorPreset] = useState("Keine Vorlage");

  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function persistFavorites(next: string[]) {
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }

  function toggleFavorite(key: string) {
    if (favorites.includes(key)) {
      persistFavorites(favorites.filter((item) => item !== key));
    } else {
      persistFavorites([...favorites, key]);
    }
  }

  async function loadPrices(initial = false) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setBackgroundUpdating(true);
      }

      setError("");

      const response = await fetch("/api/prices", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: PricesResponse = await response.json();

      setRefGeneral(data.refGeneral);
      setRefAustria(data.refAustria);
      setRefTurkey(data.refTurkey);
      setMarketGeneral(data.marketGeneral);
      setMarketAustria(data.marketAustria);
      setMarketTurkey(data.marketTurkey);
      setUpdatedAt(data.updatedAt);
      setStatusText(data.statusText);
    } catch (caught) {
      console.error(caught);
      setError("Die Preisdaten konnten derzeit nicht geladen werden.");
      setStatusText("Fehler beim Laden der Serverdaten.");
    } finally {
      setLoading(false);
      setBackgroundUpdating(false);
    }
  }

  useEffect(() => {
    loadPrices(true);

    const interval = setInterval(() => {
      loadPrices(false);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const allRows = useMemo(() => {
    return [
      ...refGeneral,
      ...refAustria,
      ...marketGeneral,
      ...marketAustria,
      ...refTurkey,
      ...marketTurkey,
    ];
  }, [refGeneral, refAustria, marketGeneral, marketAustria, refTurkey, marketTurkey]);

  const suggestionNames = useMemo(() => {
    const unique = new Map<string, string>();

    for (const row of allRows) {
      unique.set(normalizeSearchText(row.name), row.name);
    }

    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, "de"));
  }, [allRows]);

  const normalizedQuery = normalizeSearchText(query);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];

    return suggestionNames
      .filter((name) => normalizeSearchText(name).includes(normalizedQuery))
      .slice(0, 8);
  }, [suggestionNames, normalizedQuery]);

  function filterAndSortSingle(rows: SingleRow[]) {
    const filtered = rows.filter((row) => {
      const matchesSearch = !normalizedQuery
        ? true
        : normalizeSearchText(row.name).includes(normalizedQuery);

      const matchesFavorites = onlyFavorites ? favorites.includes(row.favoriteKey) : true;

      return matchesSearch && matchesFavorites;
    });

    switch (sortKey) {
      case "name-asc":
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "de"));
      case "name-desc":
        return [...filtered].sort((a, b) => b.name.localeCompare(a.name, "de"));
      case "price-asc":
        return [...filtered].sort((a, b) => a.priceValue - b.priceValue);
      case "price-desc":
        return [...filtered].sort((a, b) => b.priceValue - a.priceValue);
      default:
        return filtered;
    }
  }

  function filterAndSortDual(rows: DualRow[]) {
    const filtered = rows.filter((row) => {
      const matchesSearch = !normalizedQuery
        ? true
        : normalizeSearchText(row.name).includes(normalizedQuery);

      const matchesFavorites = onlyFavorites ? favorites.includes(row.favoriteKey) : true;

      return matchesSearch && matchesFavorites;
    });

    switch (sortKey) {
      case "name-asc":
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "de"));
      case "name-desc":
        return [...filtered].sort((a, b) => b.name.localeCompare(a.name, "de"));
      case "price-asc":
        return [...filtered].sort((a, b) => a.priceEurValue - b.priceEurValue);
      case "price-desc":
        return [...filtered].sort((a, b) => b.priceEurValue - a.priceEurValue);
      default:
        return filtered;
    }
  }

  const visibleRefGeneral = filterAndSortSingle(refGeneral);
  const visibleRefAustria = filterAndSortSingle(refAustria);
  const visibleRefTurkey = filterAndSortDual(refTurkey);
  const visibleMarketGeneral = filterAndSortSingle(marketGeneral);
  const visibleMarketAustria = filterAndSortSingle(marketAustria);
  const visibleMarketTurkey = filterAndSortDual(marketTurkey);

  const chartOptions = useMemo(() => {
    const currentRows =
      activeTab === "ref"
        ? [...visibleRefGeneral, ...visibleRefAustria, ...visibleRefTurkey]
        : [...visibleMarketGeneral, ...visibleMarketAustria, ...visibleMarketTurkey];

    return currentRows.map((row) => ({
      key: row.chartKey,
      label: `${row.name} (EUR)`,
    }));
  }, [
    activeTab,
    visibleRefGeneral,
    visibleRefAustria,
    visibleRefTurkey,
    visibleMarketGeneral,
    visibleMarketAustria,
    visibleMarketTurkey,
  ]);

  useEffect(() => {
    if (!chartOptions.length) return;

    if (!selectedChartKey || !chartOptions.some((item) => item.key === selectedChartKey)) {
      setSelectedChartKey(chartOptions[0].key);
    }
  }, [chartOptions, selectedChartKey]);

  useEffect(() => {
    async function loadHistory() {
      if (!selectedChartKey) return;

      try {
        setHistoryLoading(true);

        const response = await fetch(
          `/api/history?chartKey=${encodeURIComponent(selectedChartKey)}&range=${chartRange}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: HistoryResponse = await response.json();
        setHistoryData(data);
      } catch (caught) {
        console.error(caught);
        setHistoryData(null);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [selectedChartKey, chartRange]);

  const eur24Ref = refGeneral.find((row) => row.name === "Gold 1 g (24K Spotpreis)")?.priceValue ?? 0;
  const eur24Market =
    marketGeneral.find((row) => row.name === "Gold 1 g (24K Spotpreis)")?.priceValue ?? eur24Ref;

  const try24Ref = refTurkey.find((row) => row.name === "Gram Altın (1 g)")?.priceTryValue ?? 0;
  const try24Market =
    marketTurkey.find((row) => row.name === "Gram Altın (1 g)")?.priceTryValue ?? try24Ref;

  const eurPerGram =
    calculatorMode === "ref"
      ? calculatorKarat === 24
        ? eur24Ref
        : eur24Ref * (22 / 24)
      : calculatorKarat === 24
      ? eur24Market
      : eur24Market * (22 / 24);

  const tryPerGram =
    calculatorMode === "ref"
      ? calculatorKarat === 24
        ? try24Ref
        : try24Ref * (22 / 24)
      : calculatorKarat === 24
      ? try24Market
      : try24Market * (22 / 24);

  const weightValue = Number(calculatorWeight.replace(",", "."));
  const calculatorResult =
    !Number.isNaN(weightValue) && weightValue > 0
      ? calculatorCurrency === "EUR"
        ? eurPerGram * weightValue
        : tryPerGram * weightValue
      : null;

  const calculatorFormatted =
    calculatorResult === null
      ? null
      : new Intl.NumberFormat("de-AT", {
          style: "currency",
          currency: calculatorCurrency,
          maximumFractionDigits: 2,
        }).format(calculatorResult);

  const emailDisplay = "a_nikbay [at] outlook [dot] com";
  const realEmail = "a_nikbay@outlook.com";

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(realEmail);
      alert("E-Mail-Adresse wurde kopiert.");
    } catch {
      alert("Kopieren war nicht möglich.");
    }
  }

  function applyCalculatorPreset(label: string) {
    setCalculatorPreset(label);

    const preset = CALCULATOR_PRESETS.find((item) => item.label === label);
    if (!preset) return;

    setCalculatorMode(preset.mode);
    setCalculatorKarat(preset.karat);
    setCalculatorWeight(preset.weight);
    setCalculatorCurrency(preset.currency);
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Goldpreise in Österreich</h1>

        <p style={introStyle}>
          Aktuelle Referenzpreise und marktnahe Richtwerte für Gold in Österreich,
          Wiener Philharmoniker, Dukaten, Goldbarren und türkisches Gold in Euro und Türkischer Lira.
        </p>

        <div style={tabContainer}>
          <button
            onClick={() => {
              setActiveTab("ref");
              setLegalTab("none");
            }}
            style={{ ...tabButton, ...(activeTab === "ref" ? activeTabStyle : {}) }}
          >
            Referenzpreise
          </button>

          <button
            onClick={() => {
              setActiveTab("market");
              setLegalTab("none");
            }}
            style={{ ...tabButton, ...(activeTab === "market" ? activeTabStyle : {}) }}
          >
            Marktpreise
          </button>
        </div>

        <div style={topInfoGridStyle}>
          <div style={topInfoCardStyle}>
            <strong>Unterschied der Tabs</strong>
            <p style={topInfoTextStyle}>
              Referenzpreise basieren direkt auf Gold-Spotpreis, Wechselkursen und Berechnungen.
              Marktpreise sind modellierte Richtwerte mit Aufschlägen je Produkt.
            </p>
          </div>

          <div style={topInfoCardStyle}>
            <strong>Live-Differenz</strong>
            <p style={topInfoTextStyle}>
              Der Wert in Klammern neben dem Preis zeigt die Veränderung seit der letzten
              automatischen Aktualisierung im 15-Sekunden-Takt.
            </p>
          </div>

          <div style={topInfoCardStyle}>
            <strong>Änderung zum Vortag</strong>
            <p style={topInfoTextStyle}>
              Die Prozentänderung vergleicht mit dem lokal gespeicherten Tagesstartwert dieses
              Kalendertags auf deinem Gerät.
            </p>
          </div>
        </div>

        <div style={toolbarStyle}>
          <div style={toolbarGroupStyle} ref={searchBoxRef}>
            <label style={labelStyle}>
              Produktsuche
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="z. B. ceyrek altin"
                style={inputStyle}
              />
            </label>

            {showSuggestions && suggestions.length > 0 && (
              <div style={suggestionBoxStyle}>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    style={suggestionItemStyle}
                    onClick={() => {
                      setQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={toolbarGroupStyle}>
            <label style={labelStyle}>
              Sortierung
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                style={selectStyle}
              >
                <option value="default">Standard</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="price-asc">Preis aufsteigend</option>
                <option value="price-desc">Preis absteigend</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => setOnlyFavorites((prev) => !prev)}
              style={{
                ...utilityButtonStyle,
                ...(onlyFavorites ? utilityButtonActiveStyle : {}),
              }}
            >
              {onlyFavorites ? "Nur Favoriten: AN" : "Nur Favoriten"}
            </button>

            <button
              type="button"
              onClick={() => loadPrices(false)}
              style={utilityButtonStyle}
            >
              Jetzt aktualisieren
            </button>
          </div>
        </div>

        <div style={statusRowStyle}>
          <span style={statusBadgeStyle}>
            {backgroundUpdating ? "Aktualisierung läuft …" : "Automatische Aktualisierung alle 15 Sekunden"}
          </span>
          <span style={statusSubtleStyle}>{statusText}</span>
        </div>

        {error && <div style={errorBoxStyle}>⚠️ {error}</div>}

        {activeTab === "ref" && (
          <>
            <p style={infoStyle}>
              Basierend auf internationalem Gold-Spotpreis (24K). Aktualisierung alle 15 Sekunden.
            </p>

            <div style={noticeBoxStyle}>
              <strong>Hinweis:</strong> Alle Angaben auf dieser Website dienen ausschließlich
              Informationszwecken. Trotz sorgfältiger Berechnung sind alle Preise unverbindliche
              Richtwerte und können von tatsächlichen Markt-, Händler- oder Ankauf-/Verkaufspreisen
              abweichen.
              <br />
              <br />
              Die dargestellten Referenzpreise werden aus externen Marktdaten und Wechselkursen
              sowie aus eigenen Berechnungen abgeleitet. Es werden keine Inhalte, Texte oder
              Preisangaben einzelner Händler-Websites direkt übernommen.
            </div>

            {loading && (
              <div style={loadingBoxStyle}>🔄 Aktuelle Preise werden geladen …</div>
            )}

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Goldpreis allgemein</h2>
              {visibleRefGeneral.length === 0 ? (
                <EmptyState text="Keine passenden Produkte gefunden." />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRefGeneral.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            active={favorites.includes(row.favoriteKey)}
                            onClick={() => toggleFavorite(row.favoriteKey)}
                          />
                        </td>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.price}
                            diffText={row.liveDiffText}
                            diffValue={row.liveDiffValue}
                          />
                        </td>
                        <td style={tdStyle}>
                          <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Goldpreis österreichisches Gold</h2>
              {visibleRefAustria.length === 0 ? (
                <EmptyState text="Keine passenden Produkte gefunden." />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRefAustria.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            active={favorites.includes(row.favoriteKey)}
                            onClick={() => toggleFavorite(row.favoriteKey)}
                          />
                        </td>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.price}
                            diffText={row.liveDiffText}
                            diffValue={row.liveDiffValue}
                          />
                        </td>
                        <td style={tdStyle}>
                          <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Goldpreis türkisches Gold</h2>
              {visibleRefTurkey.length === 0 ? (
                <EmptyState text="Keine passenden Produkte gefunden." />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis in Euro inkl. Live-Differenz</th>
                      <th style={thStyle}>Preis in Türkischer Lira inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRefTurkey.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            active={favorites.includes(row.favoriteKey)}
                            onClick={() => toggleFavorite(row.favoriteKey)}
                          />
                        </td>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.priceEur}
                            diffText={row.liveDiffTextEur}
                            diffValue={row.liveDiffValueEur}
                          />
                        </td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.priceTry}
                            diffText={row.liveDiffTextTry}
                            diffValue={row.liveDiffValueTry}
                          />
                        </td>
                        <td style={tdStyle}>
                          <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}

        {activeTab === "market" && (
          <>
            <p style={infoStyle}>
              Marktnahe Richtwerte. Aktualisierung alle 15 Sekunden.
            </p>

            <div style={noticeBoxStyle}>
              <strong>Hinweis:</strong> Alle Angaben auf dieser Website dienen ausschließlich
              Informationszwecken. Trotz sorgfältiger Berechnung sind alle Preise unverbindliche
              Richtwerte und können von tatsächlichen Markt-, Händler- oder Ankauf-/Verkaufspreisen
              abweichen.
              <br />
              <br />
              Die dargestellten Marktpreise werden automatisiert aus externen Marktdaten sowie
              eigenen Berechnungen und modellierten Aufschlägen abgeleitet. Es werden keine Inhalte,
              Texte oder Preisangaben einzelner Websites direkt übernommen; Abweichungen zu
              tatsächlichen Händlerpreisen sind daher jederzeit möglich.
            </div>

            {loading && (
              <div style={loadingBoxStyle}>🔄 Aktuelle Preise werden geladen …</div>
            )}

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Marktpreis allgemein</h2>
              {visibleMarketGeneral.length === 0 ? (
                <EmptyState text="Keine passenden Produkte gefunden." />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMarketGeneral.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            active={favorites.includes(row.favoriteKey)}
                            onClick={() => toggleFavorite(row.favoriteKey)}
                          />
                        </td>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.price}
                            diffText={row.liveDiffText}
                            diffValue={row.liveDiffValue}
                          />
                        </td>
                        <td style={tdStyle}>
                          <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Marktpreis österreichisches Gold</h2>
              {visibleMarketAustria.length === 0 ? (
                <EmptyState text="Keine passenden Produkte gefunden." />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMarketAustria.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            active={favorites.includes(row.favoriteKey)}
                            onClick={() => toggleFavorite(row.favoriteKey)}
                          />
                        </td>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.price}
                            diffText={row.liveDiffText}
                            diffValue={row.liveDiffValue}
                          />
                        </td>
                        <td style={tdStyle}>
                          <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Marktpreis türkisches Gold</h2>
              {visibleMarketTurkey.length === 0 ? (
                <EmptyState text="Keine passenden Produkte gefunden." />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis in Euro inkl. Live-Differenz</th>
                      <th style={thStyle}>Preis in Türkischer Lira inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMarketTurkey.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            active={favorites.includes(row.favoriteKey)}
                            onClick={() => toggleFavorite(row.favoriteKey)}
                          />
                        </td>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.priceEur}
                            diffText={row.liveDiffTextEur}
                            diffValue={row.liveDiffValueEur}
                          />
                        </td>
                        <td style={tdStyle}>
                          <InlinePrice
                            value={row.priceTry}
                            diffText={row.liveDiffTextTry}
                            diffValue={row.liveDiffValueTry}
                          />
                        </td>
                        <td style={tdStyle}>
                          <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Preisrechner</h2>

          <div style={calculatorGridStyle}>
            <label style={labelStyle}>
              Produktvorlage
              <select
                value={calculatorPreset}
                onChange={(event) => applyCalculatorPreset(event.target.value)}
                style={selectStyle}
              >
                {CALCULATOR_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.label}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Modus
              <select
                value={calculatorMode}
                onChange={(event) => setCalculatorMode(event.target.value as TabMode)}
                style={selectStyle}
              >
                <option value="ref">Referenzpreis</option>
                <option value="market">Marktpreis</option>
              </select>
            </label>

            <label style={labelStyle}>
              Karat
              <select
                value={calculatorKarat}
                onChange={(event) => setCalculatorKarat(Number(event.target.value) as 22 | 24)}
                style={selectStyle}
              >
                <option value={24}>24K</option>
                <option value={22}>22K</option>
              </select>
            </label>

            <label style={labelStyle}>
              Gewicht in Gramm
              <input
                value={calculatorWeight}
                onChange={(event) => setCalculatorWeight(event.target.value)}
                style={inputStyle}
                placeholder="z. B. 10"
              />
            </label>

            <label style={labelStyle}>
              Währung
              <select
                value={calculatorCurrency}
                onChange={(event) => setCalculatorCurrency(event.target.value as "EUR" | "TRY")}
                style={selectStyle}
              >
                <option value="EUR">Euro</option>
                <option value="TRY">Türkische Lira</option>
              </select>
            </label>
          </div>

          <div style={calculatorHintStyle}>
            Mit einer Produktvorlage werden Gewicht, Karat, Modus und Währung automatisch vorbelegt.
          </div>

          <div style={calculatorResultStyle}>
            {calculatorFormatted ? (
              <>
                Geschätzter Wert: <strong>{calculatorFormatted}</strong>
              </>
            ) : (
              <>Bitte ein gültiges Gewicht eingeben.</>
            )}
          </div>
        </section>

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
                style={{ ...rangeButtonStyle, ...(chartRange === "week" ? rangeButtonActiveStyle : {}) }}
              >
                7 Tage
              </button>

              <button
                type="button"
                onClick={() => setChartRange("month")}
                style={{ ...rangeButtonStyle, ...(chartRange === "month" ? rangeButtonActiveStyle : {}) }}
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

        <p style={footerSourceStyle}>
          Datenquellen: Goldpreisdaten über externe API, Wechselkursdaten über externe API,
          serverseitiges Archiv, modellierte Produktaufschläge und eigene Berechnungen.
        </p>

        <p style={updatedStyle}>Letztes Update: {updatedAt || "wird geladen …"}</p>

        <div style={bottomLegalNavStyle}>
          <button
            onClick={() =>
              setLegalTab((prev) => (prev === "impressum" ? "none" : "impressum"))
            }
            style={{
              ...bottomLegalButtonStyle,
              ...(legalTab === "impressum" ? activeBottomLegalButtonStyle : {}),
            }}
          >
            Impressum
          </button>

          <button
            onClick={() =>
              setLegalTab((prev) => (prev === "disclaimer" ? "none" : "disclaimer"))
            }
            style={{
              ...bottomLegalButtonStyle,
              ...(legalTab === "disclaimer" ? activeBottomLegalButtonStyle : {}),
            }}
          >
            Disclaimer & Datenschutz
          </button>

          <button
            onClick={() =>
              setLegalTab((prev) => (prev === "calculation" ? "none" : "calculation"))
            }
            style={{
              ...bottomLegalButtonStyle,
              ...(legalTab === "calculation" ? activeBottomLegalButtonStyle : {}),
            }}
          >
            Wie werden Marktpreise berechnet?
          </button>
        </div>

        {legalTab === "impressum" && (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Impressum</h2>

            <div style={legalTextStyle}>
              <p>
                <strong>Angaben gemäß § 5 ECG</strong>
              </p>

              <p>
                Ali Osman Nikbay
                <br />
                Arbeiterstraße 12
                <br />
                3943 Schrems
                <br />
                Österreich
              </p>

              <p>
                E-Mail: {emailDisplay}
                <br />
                <button type="button" onClick={copyEmail} style={copyButtonStyle}>
                  E-Mail kopieren
                </button>
              </p>

              <p>
                <strong>Haftungsausschluss:</strong>
                <br />
                Die auf dieser Website dargestellten Preise, Prozentänderungen und Marktwerte
                werden automatisiert aus externen Datenquellen und eigenen Berechnungen abgeleitet.
                Trotz sorgfältiger Erstellung übernehmen wir keine Gewähr für Richtigkeit,
                Vollständigkeit, Aktualität oder jederzeitige Verfügbarkeit der Inhalte.
                <br />
                Sämtliche Angaben sind unverbindlich und dienen ausschließlich der allgemeinen
                Information. Eine Haftung für Schäden oder Nachteile, die aus der Nutzung der auf
                dieser Website bereitgestellten Informationen entstehen, ist – soweit gesetzlich
                zulässig – ausgeschlossen.
              </p>

              <p>
                <strong>Keine Anlageberatung:</strong>
                <br />
                Die Inhalte dieser Website stellen weder eine Anlageberatung noch eine Kauf-,
                Verkaufs- oder Investitionsempfehlung dar. Die bereitgestellten Informationen
                ersetzen keine individuelle Beratung.
              </p>

              <p>
                <strong>Zeitstempel-Hinweis:</strong>
                <br />
                Maßgeblich ist immer der zum jeweiligen Zeitpunkt auf der Website angezeigte Stand.
                Kurzfristige Abweichungen zu externen Anbietern sind aufgrund von Zeitverzögerungen,
                Aufschlägen, Spreads und Rundungen möglich.
              </p>

              <p>
                <strong>Zu den Preisangaben:</strong>
                <br />
                Referenzpreise basieren auf internationalen Spotpreisen und Wechselkursen.
                Marktpreise sind angenäherte Richtwerte und können von tatsächlichen Händlerpreisen,
                Ankauf-/Verkaufspreisen sowie Produktpreisen einzelner Anbieter abweichen.
                Preise externer Anbieter können eigene Aufschläge, Spreads, Gebühren oder
                produktbezogene Zuschläge enthalten.
                <br />
                <br />
                Diese Website übernimmt keine Inhalte, Texte oder Preisangaben einzelner Websites
                direkt. Die angezeigten Werte werden aus externen Marktdaten sowie eigenen
                Berechnungen abgeleitet.
              </p>

              <p>
                <strong>Keine Verbindlichkeit:</strong>
                <br />
                Es kommt kein Vertragsverhältnis allein durch die Nutzung dieser Website zustande.
              </p>

              <p>
                <strong>Hinweis zum Datenschutz und zur Kontaktaufnahme:</strong>
                <br />
                Die im Impressum veröffentlichten Kontaktdaten dienen ausschließlich der gesetzlich
                vorgeschriebenen Anbieterkennzeichnung und der zulässigen Kontaktaufnahme. Einer
                missbräuchlichen Verwendung, insbesondere zur Übersendung von Werbung, Spam,
                Massenanfragen oder zur sonstigen unbefugten Weiterverarbeitung, wird ausdrücklich
                widersprochen.
              </p>
            </div>
          </section>
        )}

        {legalTab === "disclaimer" && (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Disclaimer & Datenschutz</h2>

            <div style={legalTextStyle}>
              <p>
                <strong>Disclaimer</strong>
              </p>

              <p>
                Die auf dieser Website veröffentlichten Inhalte dienen ausschließlich der allgemeinen
                Information.
              </p>

              <p>
                Die dargestellten Referenzpreise und Marktpreise werden automatisiert aus externen
                Datenquellen sowie eigenen Berechnungen abgeleitet. Trotz sorgfältiger Erstellung und
                laufender Aktualisierung übernehmen wir keine Gewähr für Richtigkeit, Vollständigkeit,
                Aktualität und Verfügbarkeit der Inhalte.
              </p>

              <p>
                Sämtliche Preisangaben sind unverbindliche Richtwerte. Abweichungen zu tatsächlichen
                Händler-, Ankauf-, Verkauf- oder Produktpreisen sind jederzeit möglich.
              </p>

              <p>
                Die Inhalte dieser Website stellen keine Anlageberatung, Rechtsberatung,
                Finanzberatung oder Kaufempfehlung dar.
              </p>

              <p>
                Eine Haftung für Schäden oder sonstige Nachteile, die direkt oder indirekt aus der
                Nutzung der auf dieser Website bereitgestellten Informationen entstehen, ist – soweit
                gesetzlich zulässig – ausgeschlossen.
              </p>

              <p>
                Zusätzlich gilt: Es werden keine Inhalte, Texte oder Preisangaben bestimmter Websites
                direkt übernommen. Die angezeigten Werte basieren auf externen Marktdaten,
                Wechselkursdaten sowie eigenen Berechnungsmodellen und Annäherungen.
              </p>

              <p>
                <strong>Datenschutz</strong>
              </p>

              <p>
                Diese Website verarbeitet personenbezogene Daten nur in jenem Umfang, der für den
                technischen Betrieb, die Bereitstellung der Website sowie zur Reichweitenmessung und
                Verbesserung des Angebots erforderlich ist.
              </p>

              <p>
                <strong>Hosting:</strong>
                <br />
                Diese Website wird über Vercel bereitgestellt. Dabei können technische Zugriffsdaten
                wie IP-Adresse, Zeitpunkt des Aufrufs, Browser-Informationen, Gerätedaten und
                aufgerufene Seiten verarbeitet werden, soweit dies zur sicheren und stabilen
                Bereitstellung der Website erforderlich ist.
              </p>

              <p>
                <strong>Analytics:</strong>
                <br />
                Diese Website verwendet Vercel Analytics zur anonymisierten bzw. aggregierten
                Auswertung der Nutzung.
              </p>

              <p>
                <strong>Cookies und Tracking:</strong>
                <br />
                Nach aktuellem technischem Stand verwendet die eingesetzte Analytics-Lösung keine
                Third-Party-Cookies. Es kann dennoch nicht ausgeschlossen werden, dass technische
                Verbindungs- und Nutzungsdaten durch den Hosting- oder Analytics-Anbieter im
                erforderlichen Umfang verarbeitet werden.
              </p>

              <p>
                <strong>Rechtsgrundlage:</strong>
                <br />
                Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an der
                sicheren Bereitstellung der Website, an der technischen Fehlerbehebung sowie an der
                anonymisierten statistischen Auswertung und Verbesserung unseres Online-Angebots.
              </p>

              <p>
                <strong>Speicherdauer:</strong>
                <br />
                Personenbezogene Daten werden nur so lange gespeichert, wie dies für die genannten
                Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
              </p>

              <p>
                <strong>Ihre Rechte:</strong>
                <br />
                Sie haben im Rahmen der gesetzlichen Bestimmungen das Recht auf Auskunft,
                Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch sowie
                gegebenenfalls Datenübertragbarkeit. Wenn Sie der Ansicht sind, dass die Verarbeitung
                Ihrer Daten gegen Datenschutzrecht verstößt, können Sie sich an die zuständige
                Datenschutzbehörde wenden.
              </p>

              <p>
                <strong>Kontakt:</strong>
                <br />
                Für Anfragen zum Datenschutz oder zu den auf dieser Website verarbeiteten Daten
                können Sie die oben angegebene E-Mail-Adresse verwenden.
              </p>
            </div>
          </section>
        )}

        {legalTab === "calculation" && (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Wie werden Marktpreise berechnet?</h2>

            <div style={legalTextStyle}>
              <p>
                Ausgangspunkt ist der internationale Spotpreis für Gold sowie aktuelle EUR/USD- und
                EUR/TRY-Wechselkurse.
              </p>

              <p>
                Für Referenzpreise werden Goldreinheit, Feingoldgewicht und Wechselkurs direkt auf
                das jeweilige Produkt angewendet.
              </p>

              <p>
                Für Marktpreise werden anschließend modellierte produktbezogene Aufschläge verwendet.
                Diese Marktpreise sind daher Richtwerte und keine direkt übernommenen Händlerpreise.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#f5f7fb",
  padding: "30px 15px 40px",
  fontFamily: "Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const titleStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "bold",
  marginBottom: "12px",
  textAlign: "center",
  color: "#1f2937",
};

const introStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#4b5563",
  marginBottom: "24px",
  fontSize: "16px",
  lineHeight: 1.6,
};

const infoStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  marginBottom: "20px",
  fontSize: "15px",
};

const topInfoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
  marginBottom: "22px",
};

const topInfoCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "16px 18px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  color: "#1f2937",
};

const topInfoTextStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "#4b5563",
  lineHeight: 1.6,
  fontSize: "14px",
};

const toolbarStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  padding: "16px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const toolbarGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "flex-end",
  position: "relative",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
  minWidth: "180px",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "11px 12px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#fff",
};

const selectStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "11px 12px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#fff",
};

const suggestionBoxStyle: React.CSSProperties = {
  position: "absolute",
  top: "86px",
  left: 0,
  width: "280px",
  maxWidth: "90vw",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
  zIndex: 20,
  overflow: "hidden",
};

const suggestionItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "none",
  backgroundColor: "#fff",
  padding: "12px 14px",
  cursor: "pointer",
  fontSize: "14px",
};

const utilityButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 14px",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  color: "#111827",
  fontWeight: 700,
  fontSize: "14px",
};

const utilityButtonActiveStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

const statusRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  borderRadius: "999px",
  backgroundColor: "#e0f2fe",
  color: "#075985",
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: "13px",
};

const statusSubtleStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
};

const loadingBoxStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "20px",
  backgroundColor: "#eef6ff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  fontWeight: 600,
};

const errorBoxStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "20px",
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  fontWeight: 600,
};

const noticeBoxStyle: React.CSSProperties = {
  backgroundColor: "#fff8e7",
  border: "1px solid #f4d58d",
  borderRadius: "14px",
  padding: "16px 18px",
  marginBottom: "24px",
  color: "#5b4a1f",
  lineHeight: 1.6,
  fontSize: "14px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "24px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  overflowX: "auto",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "24px",
  marginBottom: "16px",
  color: "#111827",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "2px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  color: "#374151",
  fontSize: "15px",
};

const favoriteThStyle: React.CSSProperties = {
  ...thStyle,
  width: "58px",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#1f2937",
  fontSize: "15px",
  verticalAlign: "top",
};

const favoriteTdStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "center",
};

const favoriteButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "22px",
  lineHeight: 1,
  color: "#9ca3af",
};

const favoriteButtonActiveStyle: React.CSSProperties = {
  color: "#f59e0b",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  backgroundColor: "#f9fafb",
  color: "#6b7280",
  textAlign: "center",
  fontWeight: 600,
};

const tabContainer: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "25px",
  flexWrap: "wrap",
};

const tabButton: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  fontWeight: 700,
  fontSize: "14px",
};

const activeTabStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

const calculatorGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const calculatorHintStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  marginBottom: "14px",
};

const calculatorResultStyle: React.CSSProperties = {
  borderRadius: "14px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "16px 18px",
  fontSize: "16px",
  color: "#111827",
};

const historyToolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const rangeButtonWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const rangeButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 14px",
  cursor: "pointer",
  backgroundColor: "#e5e7eb",
  color: "#111827",
  fontWeight: 700,
  fontSize: "14px",
};

const rangeButtonActiveStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

const historyWrapStyle: React.CSSProperties = {
  borderRadius: "16px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "16px",
};

const historyHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const historyStatsStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  color: "#374151",
  fontSize: "14px",
  alignItems: "center",
};

const historyLabelsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "12px",
  flexWrap: "wrap",
};

const historyLabelItemStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center",
  minWidth: "52px",
};

const footerSourceStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "8px",
  lineHeight: 1.6,
};

const updatedStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "14px",
  marginTop: "10px",
};

const bottomLegalNavStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  marginTop: "16px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const bottomLegalButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#374151",
  cursor: "pointer",
  textDecoration: "underline",
  fontSize: "14px",
  padding: "6px 8px",
};

const activeBottomLegalButtonStyle: React.CSSProperties = {
  color: "#111827",
  fontWeight: 700,
};

const legalTextStyle: React.CSSProperties = {
  color: "#1f2937",
  lineHeight: 1.8,
  fontSize: "15px",
};

const copyButtonStyle: React.CSSProperties = {
  marginTop: "8px",
  border: "none",
  borderRadius: "10px",
  padding: "10px 12px",
  backgroundColor: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
};