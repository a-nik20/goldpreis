"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Currency = "EUR" | "TRY";
type TabMode = "ref" | "market";
type LegalTab = "none" | "impressum" | "disclaimer" | "calculation";
type SortKey = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc";
type SectionKey =
  | "refGeneral"
  | "refAustria"
  | "refTurkey"
  | "marketGeneral"
  | "marketAustria"
  | "marketTurkey";

type SingleRow = {
  id: string;
  name: string;
  section: SectionKey;
  priceValue: number;
  price: string;
  liveDiffText: string;
  liveDiffValue: number | null;
  dayChangeText: string;
  dayChangeValue: number | null;
  favoriteKey: string;
  chartKeyEur: string;
};

type DualRow = {
  id: string;
  name: string;
  section: SectionKey;
  priceEurValue: number;
  priceEur: string;
  priceTryValue: number;
  priceTry: string;
  liveDiffTextEur: string;
  liveDiffValueEur: number | null;
  liveDiffTextTry: string;
  liveDiffValueTry: number | null;
  dayChangeText: string;
  dayChangeValue: number | null;
  favoriteKey: string;
  chartKeyEur: string;
  chartKeyTry: string;
};

type Snapshot = Record<string, number>;

type RawSnapshot = Record<SectionKey, Snapshot>;

type GoldApiResponse = {
  price?: number;
  prev_close_price?: number;
  prev_close?: number;
  previous_close?: number;
  close_price?: number;
  close?: number;
  open_price?: number;
  open?: number;
};

type FxRangeResponse = {
  rates?: Record<string, { USD?: number; TRY?: number }>;
};

type ChartPoint = {
  ts: number;
  value: number;
};

type HistoryStore = Record<string, ChartPoint[]>;

const REFRESH_INTERVAL_MS = 15000;
const OUNCE_IN_GRAMS = 31.1034768;
const HISTORY_LIMIT = 160;
const LOCAL_STORAGE_KEYS = {
  previousSnapshot: "goldpreis_previous_snapshot_v2",
  dailyBaseline: "goldpreis_daily_baseline_v2",
  history: "goldpreis_history_v2",
  favorites: "goldpreis_favorites_v2",
};

const MARKET_PREMIUMS = {
  general: {
    "Gold 1 g (24K Spotpreis)": 1.0,
    "Gold 1 oz (24K Spotpreis)": 1.0,
    "Goldbarren 1 g": 1.398,
    "Goldbarren 5 g": 1.141,
    "Goldbarren 10 g": 1.076,
    "Goldbarren 50 g": 1.039,
    "Goldbarren 100 g": 1.032,
  },
  austria: {
    "Wiener Philharmoniker 1 oz": 1.027,
    "Wiener Philharmoniker 1/2 oz": 1.067,
    "Wiener Philharmoniker 1/4 oz": 1.087,
    "Wiener Philharmoniker 1/10 oz": 1.136,
    "Wiener Philharmoniker 1/25 oz": 1.276,
    "Franz Joseph 1-fach Dukat (3,44 g fein)": 1.097,
    "Franz Joseph 4-fach Dukat (13,77 g fein)": 1.062,
    "10 Kronen Gold (3,05 g fein)": 1.096,
    "20 Kronen Gold (6,10 g fein)": 1.076,
    "100 Kronen Gold (30,49 g fein)": 1.037,
    "Vier Gulden Gold (2,90 g fein)": 1.118,
    "Acht Gulden Gold (5,81 g fein)": 1.086,
  },
  turkey24k: {
    "Gram Altın (1 g)": 1.0,
    "Çeyrek Altın (1,75 g)": 1.003,
    "Yarım Altın (3,50 g)": 1.005,
    "Tam Altın (7,00 g)": 1.004,
    "Reşat Altın (7,20 g)": 0.989,
    "Gremse Altın (17,50 g)": 1.004,
    "Große Reşat Gold (36,00 g)": 0.989,
  },
  turkey22k: {
    "Gold-Armreif 1 g (22 Ayar)": 1.082,
    "Gold-Armreif 10 g (22 Ayar)": 1.082,
    "Gold-Armreif 15 g (22 Ayar)": 1.082,
    "Gold-Armreif 20 g (22 Ayar)": 1.082,
  },
} as const;

const GENERAL_ITEMS = [
  { name: "Gold 1 g (24K Spotpreis)", grams24: 1 },
  { name: "Gold 1 oz (24K Spotpreis)", grams24: OUNCE_IN_GRAMS },
  { name: "Goldbarren 1 g", grams24: 1 },
  { name: "Goldbarren 5 g", grams24: 5 },
  { name: "Goldbarren 10 g", grams24: 10 },
  { name: "Goldbarren 50 g", grams24: 50 },
  { name: "Goldbarren 100 g", grams24: 100 },
] as const;

const AUSTRIA_ITEMS = [
  { name: "Wiener Philharmoniker 1 oz", grams24: 31.1034768 },
  { name: "Wiener Philharmoniker 1/2 oz", grams24: 15.5517384 },
  { name: "Wiener Philharmoniker 1/4 oz", grams24: 7.7758692 },
  { name: "Wiener Philharmoniker 1/10 oz", grams24: 3.11034768 },
  { name: "Wiener Philharmoniker 1/25 oz", grams24: 1.244139072 },
  { name: "Franz Joseph 1-fach Dukat (3,44 g fein)", grams24: 3.44 },
  { name: "Franz Joseph 4-fach Dukat (13,77 g fein)", grams24: 13.77 },
  { name: "10 Kronen Gold (3,05 g fein)", grams24: 3.05 },
  { name: "20 Kronen Gold (6,10 g fein)", grams24: 6.1 },
  { name: "100 Kronen Gold (30,49 g fein)", grams24: 30.49 },
  { name: "Vier Gulden Gold (2,90 g fein)", grams24: 2.9 },
  { name: "Acht Gulden Gold (5,81 g fein)", grams24: 5.81 },
] as const;

const TURKEY_ITEMS = [
  { name: "Gram Altın (1 g)", grams: 1, karat: 24 },
  { name: "Çeyrek Altın (1,75 g)", grams: 1.75, karat: 24 },
  { name: "Yarım Altın (3,50 g)", grams: 3.5, karat: 24 },
  { name: "Tam Altın (7,00 g)", grams: 7.0, karat: 24 },
  { name: "Reşat Altın (7,20 g)", grams: 7.2, karat: 24 },
  { name: "Gremse Altın (17,50 g)", grams: 17.5, karat: 24 },
  { name: "Große Reşat Gold (36,00 g)", grams: 36.0, karat: 24 },
  { name: "Gold-Armreif 1 g (22 Ayar)", grams: 1, karat: 22 },
  { name: "Gold-Armreif 10 g (22 Ayar)", grams: 10, karat: 22 },
  { name: "Gold-Armreif 15 g (22 Ayar)", grams: 15, karat: 22 },
  { name: "Gold-Armreif 20 g (22 Ayar)", grams: 20, karat: 22 },
] as const;

const EMPTY_SNAPSHOT: RawSnapshot = {
  refGeneral: {},
  refAustria: {},
  refTurkey: {},
  marketGeneral: {},
  marketAustria: {},
  marketTurkey: {},
};

const EMAIL_PARTS = {
  local: ["a", "_", "nikbay"].join(""),
  domain: ["outlook", ".", "com"].join(""),
};

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getTodayKey() {
  return new Date().toLocaleDateString("sv-SE");
}

function formatCurrency(value: number, currency: Currency) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAbsoluteDiff(value: number | null, currency: Currency) {
  if (value === null || Number.isNaN(value)) return "–";

  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(abs);

  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "–";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function calcAbsoluteDiff(current: number, previous: number | null) {
  if (previous === null || Number.isNaN(previous)) return null;
  return current - previous;
}

function calcPercentChange(current: number, previous: number | null) {
  if (previous === null || previous === 0 || Number.isNaN(previous)) return null;
  return ((current - previous) / previous) * 100;
}

function getPreviousGoldUsdPerOz(gold: GoldApiResponse): number | null {
  const candidates = [
    gold.prev_close_price,
    gold.prev_close,
    gold.previous_close,
    gold.close_price,
    gold.close,
    gold.open_price,
    gold.open,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && !Number.isNaN(value) && value > 0) {
      return value;
    }
  }

  return null;
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

function toChartKey(currency: Currency, name: string) {
  return `${currency}::${name}`;
}

function makeFavoriteKey(section: SectionKey, name: string) {
  return `${section}::${name}`;
}

function buildEmptyStateMessage(search: string, onlyFavorites: boolean) {
  if (search.trim() && onlyFavorites) {
    return "Keine Treffer in deinen Favoriten.";
  }
  if (search.trim()) {
    return "Keine passenden Produkte gefunden.";
  }
  if (onlyFavorites) {
    return "Du hast noch keine Favoriten markiert.";
  }
  return "Derzeit sind keine Daten verfügbar.";
}

function sortSingleRows(rows: SingleRow[], sortKey: SortKey) {
  const clone = [...rows];
  switch (sortKey) {
    case "name-asc":
      return clone.sort((a, b) => a.name.localeCompare(b.name, "de"));
    case "name-desc":
      return clone.sort((a, b) => b.name.localeCompare(a.name, "de"));
    case "price-asc":
      return clone.sort((a, b) => a.priceValue - b.priceValue);
    case "price-desc":
      return clone.sort((a, b) => b.priceValue - a.priceValue);
    default:
      return clone;
  }
}

function sortDualRows(rows: DualRow[], sortKey: SortKey) {
  const clone = [...rows];
  switch (sortKey) {
    case "name-asc":
      return clone.sort((a, b) => a.name.localeCompare(b.name, "de"));
    case "name-desc":
      return clone.sort((a, b) => b.name.localeCompare(a.name, "de"));
    case "price-asc":
      return clone.sort((a, b) => a.priceEurValue - b.priceEurValue);
    case "price-desc":
      return clone.sort((a, b) => b.priceEurValue - a.priceEurValue);
    default:
      return clone;
  }
}

function buildChartPath(points: ChartPoint[], width: number, height: number, padding: number) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const x = padding;
    const y = height / 2;
    return `M ${x} ${y} L ${width - padding} ${y}`;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x =
        padding +
        (index / (points.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((point.value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

async function fetchJsonWithTimeout<T>(url: string, label: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${label}: HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${label}: Zeitüberschreitung`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

function DayChangeCell({
  changeText,
  changeValue,
}: {
  changeText: string;
  changeValue: number | null;
}) {
  const color = getTrendColor(changeValue);
  const arrow = getTrendArrow(changeValue);

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
      {changeText === "–" ? (
        <span>–</span>
      ) : (
        <>
          <span>{arrow}</span>
          <span>{changeText}</span>
        </>
      )}
    </span>
  );
}

function FavoriteButton({
  isFavorite,
  onToggle,
}: {
  isFavorite: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      type="button"
      aria-label={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      title={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      style={{
        ...favoriteButtonStyle,
        ...(isFavorite ? favoriteButtonActiveStyle : {}),
      }}
    >
      {isFavorite ? "★" : "☆"}
    </button>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return <div style={emptyStateStyle}>{message}</div>;
}

function HistoryChart({
  points,
  selectedLabel,
}: {
  points: ChartPoint[];
  selectedLabel: string;
}) {
  const width = 900;
  const height = 280;
  const padding = 28;
  const path = buildChartPath(points, width, height, padding);

  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const latest = values.length ? values[values.length - 1] : 0;
  const earliest = values.length ? values[0] : 0;
  const diff = latest - earliest;

  return (
    <div style={historyWrapStyle}>
      <div style={historyHeaderStyle}>
        <div>
          <strong>{selectedLabel}</strong>
          <div style={historyMetaStyle}>
            Verlauf der lokal gespeicherten Werte auf diesem Gerät
          </div>
        </div>
        <div style={historyStatsStyle}>
          <span>Min: {formatCurrency(min, selectedLabel.includes("TRY") ? "TRY" : "EUR")}</span>
          <span>Max: {formatCurrency(max, selectedLabel.includes("TRY") ? "TRY" : "EUR")}</span>
          <span style={{ color: getTrendColor(diff) }}>
            Verlauf: {diff >= 0 ? "+" : ""}
            {formatCurrency(diff, selectedLabel.includes("TRY") ? "TRY" : "EUR")}
          </span>
        </div>
      </div>

      {points.length < 2 ? (
        <div style={emptyStateStyle}>
          Noch zu wenig Verlauf vorhanden. Lass die Seite etwas laufen, damit Werte gesammelt werden.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", minWidth: "680px", height: "280px", display: "block" }}
            role="img"
            aria-label={`Historischer Verlauf für ${selectedLabel}`}
          >
            <line x1="28" y1="28" x2="28" y2="252" stroke="#d1d5db" strokeWidth="1" />
            <line x1="28" y1="252" x2="872" y2="252" stroke="#d1d5db" strokeWidth="1" />
            <path d={path} fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {children}
    </section>
  );
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

  const [updated, setUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [backgroundUpdating, setBackgroundUpdating] = useState(false);
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("Bereit");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [calculatorMode, setCalculatorMode] = useState<TabMode>("ref");
  const [calculatorKarat, setCalculatorKarat] = useState<22 | 24>(24);
  const [calculatorWeight, setCalculatorWeight] = useState("10");
  const [calculatorCurrency, setCalculatorCurrency] = useState<Currency>("EUR");

  const [historyStore, setHistoryStore] = useState<HistoryStore>({});
  const [selectedChartKey, setSelectedChartKey] = useState("");

  const previousRef = useRef<RawSnapshot>(EMPTY_SNAPSHOT);
  const dailyBaselineRef = useRef<{ date: string; snapshot: RawSnapshot } | null>(null);

  useEffect(() => {
    const storedPrevious = safeJsonParse<RawSnapshot>(
      localStorage.getItem(LOCAL_STORAGE_KEYS.previousSnapshot),
      EMPTY_SNAPSHOT
    );
    const storedDailyBaseline = safeJsonParse<{ date: string; snapshot: RawSnapshot } | null>(
      localStorage.getItem(LOCAL_STORAGE_KEYS.dailyBaseline),
      null
    );
    const storedHistory = safeJsonParse<HistoryStore>(
      localStorage.getItem(LOCAL_STORAGE_KEYS.history),
      {}
    );
    const storedFavorites = safeJsonParse<string[]>(
      localStorage.getItem(LOCAL_STORAGE_KEYS.favorites),
      []
    );

    previousRef.current = storedPrevious;
    dailyBaselineRef.current = storedDailyBaseline;
    setHistoryStore(storedHistory);
    setFavorites(storedFavorites);
  }, []);

  function persistPreviousSnapshot(snapshot: RawSnapshot) {
    previousRef.current = snapshot;
    localStorage.setItem(LOCAL_STORAGE_KEYS.previousSnapshot, JSON.stringify(snapshot));
  }

  function ensureDailyBaseline(snapshot: RawSnapshot) {
    const today = getTodayKey();
    const current = dailyBaselineRef.current;

    if (!current || current.date !== today) {
      const next = { date: today, snapshot };
      dailyBaselineRef.current = next;
      localStorage.setItem(LOCAL_STORAGE_KEYS.dailyBaseline, JSON.stringify(next));
    }
  }

  function appendHistory(entries: Array<{ key: string; value: number }>) {
    setHistoryStore((current) => {
      const next: HistoryStore = { ...current };
      const now = Date.now();

      for (const entry of entries) {
        const existing = next[entry.key] ?? [];
        const last = existing[existing.length - 1];

        if (!last || Math.abs(last.value - entry.value) > 0.0001 || now - last.ts > REFRESH_INTERVAL_MS * 2) {
          next[entry.key] = [...existing, { ts: now, value: entry.value }].slice(-HISTORY_LIMIT);
        }
      }

      localStorage.setItem(LOCAL_STORAGE_KEYS.history, JSON.stringify(next));
      return next;
    });
  }

  function toggleFavorite(favoriteKey: string) {
    setFavorites((current) => {
      const next = current.includes(favoriteKey)
        ? current.filter((item) => item !== favoriteKey)
        : [...current, favoriteKey];
      localStorage.setItem(LOCAL_STORAGE_KEYS.favorites, JSON.stringify(next));
      return next;
    });
  }

  async function loadData(isInitial = false) {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setBackgroundUpdating(true);
      }

      setError("");
      setStatusText("Aktualisiere Daten …");

      const today = new Date();
      const fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);

      const from = fromDate.toISOString().slice(0, 10);
      const to = today.toISOString().slice(0, 10);

      const [gold, fxData] = await Promise.all([
        fetchJsonWithTimeout<GoldApiResponse>(
          "https://api.gold-api.com/price/XAU",
          "Goldpreis-API"
        ),
        fetchJsonWithTimeout<FxRangeResponse>(
          `https://api.frankfurter.dev/v1/${from}..${to}?base=EUR&symbols=USD,TRY`,
          "Wechselkurs-API"
        ),
      ]);

      if (!gold?.price) {
        throw new Error("Goldpreis-API: Keine gültigen Goldpreisdaten erhalten.");
      }

      if (!fxData?.rates || Object.keys(fxData.rates).length < 2) {
        throw new Error("Wechselkurs-API: Zu wenige oder unvollständige Wechselkursdaten.");
      }

      const rateDates = Object.keys(fxData.rates).sort();
      const latestDate = rateDates[rateDates.length - 1];
      const previousDate = rateDates[rateDates.length - 2];

      const latestRates = fxData.rates[latestDate];
      const previousRates = fxData.rates[previousDate];

      const usdPerEurToday = latestRates?.USD;
      const tryPerEurToday = latestRates?.TRY;
      const usdPerEurBaseline = previousRates?.USD;
      const tryPerEurBaseline = previousRates?.TRY;

      if (!usdPerEurToday || !tryPerEurToday || !usdPerEurBaseline || !tryPerEurBaseline) {
        throw new Error("Wechselkurs-API: Wechselkurse für USD oder TRY fehlen.");
      }

      const goldUsdPerOz = gold.price;
      const previousGoldUsdPerOz = getPreviousGoldUsdPerOz(gold);

      const goldEurPerOz = goldUsdPerOz / usdPerEurToday;
      const goldTryPerOz = goldEurPerOz * tryPerEurToday;
      const goldEurPerGram24 = goldEurPerOz / OUNCE_IN_GRAMS;
      const goldTryPerGram24 = goldTryPerOz / OUNCE_IN_GRAMS;

      const goldEurPerOzPrevClose =
        previousGoldUsdPerOz !== null ? previousGoldUsdPerOz / usdPerEurBaseline : null;
      const goldTryPerOzPrevClose =
        goldEurPerOzPrevClose !== null ? goldEurPerOzPrevClose * tryPerEurBaseline : null;
      const goldEurPerGram24PrevClose =
        goldEurPerOzPrevClose !== null ? goldEurPerOzPrevClose / OUNCE_IN_GRAMS : null;
      const goldTryPerGram24PrevClose =
        goldTryPerOzPrevClose !== null ? goldTryPerOzPrevClose / OUNCE_IN_GRAMS : null;

      const goldEurPerGram22 = goldEurPerGram24 * (22 / 24);
      const goldTryPerGram22 = goldTryPerGram24 * (22 / 24);
      const goldEurPerGram22PrevClose =
        goldEurPerGram24PrevClose !== null ? goldEurPerGram24PrevClose * (22 / 24) : null;
      const goldTryPerGram22PrevClose =
        goldTryPerGram24PrevClose !== null ? goldTryPerGram24PrevClose * (22 / 24) : null;

      const prev = previousRef.current;
      const baselineSnapshot = dailyBaselineRef.current?.snapshot ?? EMPTY_SNAPSHOT;

      const refGeneralRaw: Snapshot = {};
      const refAustriaRaw: Snapshot = {};
      const refTurkeyRaw: Snapshot = {};
      const marketGeneralRaw: Snapshot = {};
      const marketAustriaRaw: Snapshot = {};
      const marketTurkeyRaw: Snapshot = {};

      const historyEntries: Array<{ key: string; value: number }> = [];

      const nextRefGeneral: SingleRow[] = GENERAL_ITEMS.map((item) => {
        const current = goldEurPerGram24 * item.grams24;
        refGeneralRaw[item.name] = current;

        const prevLive = prev.refGeneral[item.name] ?? null;
        const dayBaseline = baselineSnapshot.refGeneral[item.name] ?? null;
        const liveDiffValue = calcAbsoluteDiff(current, prevLive);
        const dayChangeValue = calcPercentChange(current, dayBaseline);

        historyEntries.push({
          key: toChartKey("EUR", item.name),
          value: current,
        });

        return {
          id: `ref-general-${item.name}`,
          name: item.name,
          section: "refGeneral",
          priceValue: current,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          dayChangeText: formatPercent(dayChangeValue),
          dayChangeValue,
          favoriteKey: makeFavoriteKey("refGeneral", item.name),
          chartKeyEur: toChartKey("EUR", item.name),
        };
      });

      const nextRefAustria: SingleRow[] = AUSTRIA_ITEMS.map((item) => {
        const current = goldEurPerGram24 * item.grams24;
        refAustriaRaw[item.name] = current;

        const prevLive = prev.refAustria[item.name] ?? null;
        const dayBaseline = baselineSnapshot.refAustria[item.name] ?? null;
        const liveDiffValue = calcAbsoluteDiff(current, prevLive);
        const dayChangeValue = calcPercentChange(current, dayBaseline);

        historyEntries.push({
          key: toChartKey("EUR", item.name),
          value: current,
        });

        return {
          id: `ref-austria-${item.name}`,
          name: item.name,
          section: "refAustria",
          priceValue: current,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          dayChangeText: formatPercent(dayChangeValue),
          dayChangeValue,
          favoriteKey: makeFavoriteKey("refAustria", item.name),
          chartKeyEur: toChartKey("EUR", item.name),
        };
      });

      const nextRefTurkey: DualRow[] = TURKEY_ITEMS.map((item) => {
        const is22 = item.karat === 22;

        const eurPerGram = is22 ? goldEurPerGram22 : goldEurPerGram24;
        const tryPerGram = is22 ? goldTryPerGram22 : goldTryPerGram24;
        const tryPerGramPrevClose = is22 ? goldTryPerGram22PrevClose : goldTryPerGram24PrevClose;
        const eurPerGramPrevClose = is22 ? goldEurPerGram22PrevClose : goldEurPerGram24PrevClose;

        const currentEur = eurPerGram * item.grams;
        const currentTry = tryPerGram * item.grams;

        refTurkeyRaw[item.name] = currentEur;

        const prevLiveEur = prev.refTurkey[item.name] ?? null;
        const prevLiveTry = prev.refTurkey[`TRY::${item.name}`] ?? null;

        const dayBaselineTry = baselineSnapshot.refTurkey[`TRY::${item.name}`] ?? null;
        const liveDiffValueEur = calcAbsoluteDiff(currentEur, prevLiveEur);
        const liveDiffValueTry = calcAbsoluteDiff(currentTry, prevLiveTry);
        const dayChangeValue = calcPercentChange(currentTry, dayBaselineTry);

        historyEntries.push({ key: toChartKey("EUR", item.name), value: currentEur });
        historyEntries.push({ key: toChartKey("TRY", item.name), value: currentTry });

        if (eurPerGramPrevClose !== null && tryPerGramPrevClose !== null) {
          void eurPerGramPrevClose;
          void tryPerGramPrevClose;
        }

        return {
          id: `ref-turkey-${item.name}`,
          name: item.name,
          section: "refTurkey",
          priceEurValue: currentEur,
          priceEur: formatCurrency(currentEur, "EUR"),
          priceTryValue: currentTry,
          priceTry: formatCurrency(currentTry, "TRY"),
          liveDiffTextEur: formatAbsoluteDiff(liveDiffValueEur, "EUR"),
          liveDiffValueEur,
          liveDiffTextTry: formatAbsoluteDiff(liveDiffValueTry, "TRY"),
          liveDiffValueTry,
          dayChangeText: formatPercent(dayChangeValue),
          dayChangeValue,
          favoriteKey: makeFavoriteKey("refTurkey", item.name),
          chartKeyEur: toChartKey("EUR", item.name),
          chartKeyTry: toChartKey("TRY", item.name),
        };
      });

      const nextMarketGeneral: SingleRow[] = GENERAL_ITEMS.map((item) => {
        const factor = MARKET_PREMIUMS.general[item.name] ?? 1;
        const current = refGeneralRaw[item.name] * factor;
        marketGeneralRaw[item.name] = current;

        const prevLive = prev.marketGeneral[item.name] ?? null;
        const dayBaseline = baselineSnapshot.marketGeneral[item.name] ?? null;
        const liveDiffValue = calcAbsoluteDiff(current, prevLive);
        const dayChangeValue = calcPercentChange(current, dayBaseline);

        historyEntries.push({
          key: toChartKey("EUR", `Markt: ${item.name}`),
          value: current,
        });

        return {
          id: `market-general-${item.name}`,
          name: item.name,
          section: "marketGeneral",
          priceValue: current,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          dayChangeText: formatPercent(dayChangeValue),
          dayChangeValue,
          favoriteKey: makeFavoriteKey("marketGeneral", item.name),
          chartKeyEur: toChartKey("EUR", `Markt: ${item.name}`),
        };
      });

      const nextMarketAustria: SingleRow[] = AUSTRIA_ITEMS.map((item) => {
        const factor = MARKET_PREMIUMS.austria[item.name] ?? 1;
        const current = refAustriaRaw[item.name] * factor;
        marketAustriaRaw[item.name] = current;

        const prevLive = prev.marketAustria[item.name] ?? null;
        const dayBaseline = baselineSnapshot.marketAustria[item.name] ?? null;
        const liveDiffValue = calcAbsoluteDiff(current, prevLive);
        const dayChangeValue = calcPercentChange(current, dayBaseline);

        historyEntries.push({
          key: toChartKey("EUR", `Markt: ${item.name}`),
          value: current,
        });

        return {
          id: `market-austria-${item.name}`,
          name: item.name,
          section: "marketAustria",
          priceValue: current,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          dayChangeText: formatPercent(dayChangeValue),
          dayChangeValue,
          favoriteKey: makeFavoriteKey("marketAustria", item.name),
          chartKeyEur: toChartKey("EUR", `Markt: ${item.name}`),
        };
      });

      const nextMarketTurkey: DualRow[] = TURKEY_ITEMS.map((item) => {
        const is22 = item.karat === 22;
        const factor = is22
          ? MARKET_PREMIUMS.turkey22k[item.name as keyof typeof MARKET_PREMIUMS.turkey22k] ?? 1
          : MARKET_PREMIUMS.turkey24k[item.name as keyof typeof MARKET_PREMIUMS.turkey24k] ?? 1;

        const baseEurPerGram = is22 ? goldEurPerGram22 : goldEurPerGram24;
        const baseTryPerGram = is22 ? goldTryPerGram22 : goldTryPerGram24;

        const currentEur = baseEurPerGram * item.grams * factor;
        const currentTry = baseTryPerGram * item.grams * factor;

        marketTurkeyRaw[item.name] = currentEur;

        const prevLiveEur = prev.marketTurkey[item.name] ?? null;
        const prevLiveTry = prev.marketTurkey[`TRY::${item.name}`] ?? null;
        const dayBaselineTry = baselineSnapshot.marketTurkey[`TRY::${item.name}`] ?? null;

        const liveDiffValueEur = calcAbsoluteDiff(currentEur, prevLiveEur);
        const liveDiffValueTry = calcAbsoluteDiff(currentTry, prevLiveTry);
        const dayChangeValue = calcPercentChange(currentTry, dayBaselineTry);

        historyEntries.push({
          key: toChartKey("EUR", `Markt: ${item.name}`),
          value: currentEur,
        });
        historyEntries.push({
          key: toChartKey("TRY", `Markt: ${item.name}`),
          value: currentTry,
        });

        return {
          id: `market-turkey-${item.name}`,
          name: item.name,
          section: "marketTurkey",
          priceEurValue: currentEur,
          priceEur: formatCurrency(currentEur, "EUR"),
          priceTryValue: currentTry,
          priceTry: formatCurrency(currentTry, "TRY"),
          liveDiffTextEur: formatAbsoluteDiff(liveDiffValueEur, "EUR"),
          liveDiffValueEur,
          liveDiffTextTry: formatAbsoluteDiff(liveDiffValueTry, "TRY"),
          liveDiffValueTry,
          dayChangeText: formatPercent(dayChangeValue),
          dayChangeValue,
          favoriteKey: makeFavoriteKey("marketTurkey", item.name),
          chartKeyEur: toChartKey("EUR", `Markt: ${item.name}`),
          chartKeyTry: toChartKey("TRY", `Markt: ${item.name}`),
        };
      });

      const snapshotToPersist: RawSnapshot = {
        refGeneral: refGeneralRaw,
        refAustria: refAustriaRaw,
        refTurkey: {
          ...Object.fromEntries(nextRefTurkey.map((row) => [row.name, row.priceEurValue])),
          ...Object.fromEntries(nextRefTurkey.map((row) => [`TRY::${row.name}`, row.priceTryValue])),
        },
        marketGeneral: marketGeneralRaw,
        marketAustria: marketAustriaRaw,
        marketTurkey: {
          ...Object.fromEntries(nextMarketTurkey.map((row) => [row.name, row.priceEurValue])),
          ...Object.fromEntries(
            nextMarketTurkey.map((row) => [`TRY::${row.name}`, row.priceTryValue])
          ),
        },
      };

      ensureDailyBaseline(snapshotToPersist);
      persistPreviousSnapshot(snapshotToPersist);
      appendHistory(historyEntries);

      setRefGeneral(nextRefGeneral);
      setRefAustria(nextRefAustria);
      setRefTurkey(nextRefTurkey);
      setMarketGeneral(nextMarketGeneral);
      setMarketAustria(nextMarketAustria);
      setMarketTurkey(nextMarketTurkey);

      const now = new Date();
      setUpdated(
        now.toLocaleString("de-AT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setStatusText("Daten erfolgreich aktualisiert.");
    } catch (caught) {
      console.error("Fehler beim Laden:", caught);

      const message =
        caught instanceof Error
          ? caught.message
          : "Unbekannter Fehler beim Laden der Daten.";

      if (message.includes("Goldpreis-API")) {
        setError(
          "Die Goldpreisdaten konnten derzeit nicht geladen werden. Bitte versuche es in Kürze erneut."
        );
      } else if (message.includes("Wechselkurs-API")) {
        setError(
          "Die Wechselkursdaten konnten derzeit nicht geladen werden. Bitte versuche es in Kürze erneut."
        );
      } else if (message.includes("Zeitüberschreitung")) {
        setError(
          "Die Datenabfrage hat zu lange gedauert. Bitte aktualisiere die Seite in einem Moment erneut."
        );
      } else {
        setError(
          "Preise konnten derzeit nicht vollständig geladen werden. Bitte versuche es in Kürze erneut."
        );
      }

      setStatusText(message);
    } finally {
      setLoading(false);
      setBackgroundUpdating(false);
    }
  }

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const singleSections = useMemo(
    () => ({
      refGeneral,
      refAustria,
      marketGeneral,
      marketAustria,
    }),
    [refGeneral, refAustria, marketGeneral, marketAustria]
  );

  const dualSections = useMemo(
    () => ({
      refTurkey,
      marketTurkey,
    }),
    [refTurkey, marketTurkey]
  );

  function filterSingleRows(rows: SingleRow[]) {
    let result = [...rows];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => row.name.toLowerCase().includes(query));
    }

    if (onlyFavorites) {
      result = result.filter((row) => favorites.includes(row.favoriteKey));
    }

    return sortSingleRows(result, sortKey);
  }

  function filterDualRows(rows: DualRow[]) {
    let result = [...rows];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => row.name.toLowerCase().includes(query));
    }

    if (onlyFavorites) {
      result = result.filter((row) => favorites.includes(row.favoriteKey));
    }

    return sortDualRows(result, sortKey);
  }

  const visibleRefGeneral = filterSingleRows(singleSections.refGeneral);
  const visibleRefAustria = filterSingleRows(singleSections.refAustria);
  const visibleRefTurkey = filterDualRows(dualSections.refTurkey);

  const visibleMarketGeneral = filterSingleRows(singleSections.marketGeneral);
  const visibleMarketAustria = filterSingleRows(singleSections.marketAustria);
  const visibleMarketTurkey = filterDualRows(dualSections.marketTurkey);

  const currentSingleRows =
    activeTab === "ref"
      ? [...visibleRefGeneral, ...visibleRefAustria]
      : [...visibleMarketGeneral, ...visibleMarketAustria];

  const currentDualRows = activeTab === "ref" ? visibleRefTurkey : visibleMarketTurkey;

  const chartOptions = useMemo(() => {
    const singleOptions = currentSingleRows.map((row) => ({
      value: row.chartKeyEur,
      label: `${row.name} (EUR)`,
    }));

    const dualOptions = currentDualRows.flatMap((row) => [
      {
        value: row.chartKeyEur,
        label: `${row.name} (EUR)`,
      },
      {
        value: row.chartKeyTry,
        label: `${row.name} (TRY)`,
      },
    ]);

    return [...singleOptions, ...dualOptions];
  }, [currentSingleRows, currentDualRows]);

  useEffect(() => {
    if (!chartOptions.length) return;
    if (!selectedChartKey || !chartOptions.some((item) => item.value === selectedChartKey)) {
      setSelectedChartKey(chartOptions[0].value);
    }
  }, [chartOptions, selectedChartKey]);

  const selectedChartPoints = selectedChartKey ? historyStore[selectedChartKey] ?? [] : [];
  const selectedChartLabel =
    chartOptions.find((item) => item.value === selectedChartKey)?.label ?? "Kein Produkt gewählt";

  const currentPerGram24Ref = refGeneral.find((row) => row.name === "Gold 1 g (24K Spotpreis)")?.priceValue ?? 0;
  const currentPerGram24Market =
    marketGeneral.find((row) => row.name === "Gold 1 g (24K Spotpreis)")?.priceValue ?? currentPerGram24Ref;
  const currentPerGram22Ref = currentPerGram24Ref * (22 / 24);
  const currentPerGram22Market = currentPerGram24Market * (22 / 24);
  const calculatorWeightNumber = Number(calculatorWeight.replace(",", "."));
  const calculatorBasePerGram =
    calculatorMode === "ref"
      ? calculatorKarat === 24
        ? currentPerGram24Ref
        : currentPerGram22Ref
      : calculatorKarat === 24
      ? currentPerGram24Market
      : currentPerGram22Market;

  const calculatorResult =
    !Number.isNaN(calculatorWeightNumber) && calculatorWeightNumber > 0
      ? calculatorBasePerGram * calculatorWeightNumber
      : null;

  const calculatorTryRate =
    refTurkey.find((row) => row.name === "Gram Altın (1 g)")?.priceTryValue ??
    0;

  const derivedTryPerGram =
    calculatorKarat === 24 ? calculatorTryRate : calculatorTryRate * (22 / 24);

  const calculatorResultTry =
    !Number.isNaN(calculatorWeightNumber) && calculatorWeightNumber > 0
      ? (calculatorMode === "market"
          ? derivedTryPerGram * calculatorWeightNumber * 1.01
          : derivedTryPerGram * calculatorWeightNumber)
      : null;

  const protectedEmailDisplay = `${EMAIL_PARTS.local} [at] ${EMAIL_PARTS.domain.replace(".", " [dot] ")}`;
  const actualEmail = `${EMAIL_PARTS.local}@${EMAIL_PARTS.domain}`;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(actualEmail);
      alert("E-Mail-Adresse wurde kopiert.");
    } catch {
      alert("Kopieren war nicht möglich. Bitte manuell übernehmen.");
    }
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Goldpreise in Österreich</h1>

        <p style={introStyle}>
          Aktuelle Referenzpreise und marktnahe Richtwerte für Gold in Österreich,
          österreichische Goldmünzen und türkisches Gold in Euro und Türkischer Lira.
        </p>

        <div style={tabContainer}>
          <button
            onClick={() => {
              setActiveTab("ref");
              setLegalTab("none");
            }}
            style={{
              ...tabButton,
              ...(activeTab === "ref" ? activeTabStyle : {}),
            }}
          >
            Referenzpreise
          </button>

          <button
            onClick={() => {
              setActiveTab("market");
              setLegalTab("none");
            }}
            style={{
              ...tabButton,
              ...(activeTab === "market" ? activeTabStyle : {}),
            }}
          >
            Marktpreise
          </button>
        </div>

        <div style={topInfoGridStyle}>
          <div style={topInfoCardStyle}>
            <strong>Unterschied der Tabs</strong>
            <p style={topInfoTextStyle}>
              Referenzpreise basieren direkt auf Gold-Spotpreis, Wechselkursen und
              Berechnungen. Marktpreise sind modellierte Richtwerte mit Aufschlägen je Produkt.
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
          <div style={toolbarGroupStyle}>
            <label style={labelStyle}>
              Suche
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Produkt suchen …"
                style={inputStyle}
              />
            </label>

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
          </div>

          <div style={toolbarGroupStyle}>
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
              onClick={() => loadData(false)}
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

            <SectionCard title="Goldpreis allgemein">
              {visibleRefGeneral.length === 0 ? (
                <EmptyState message={buildEmptyStateMessage(searchQuery, onlyFavorites)} />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRefGeneral.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            isFavorite={favorites.includes(row.favoriteKey)}
                            onToggle={() => toggleFavorite(row.favoriteKey)}
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
                          <DayChangeCell
                            changeText={row.dayChangeText}
                            changeValue={row.dayChangeValue}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            <SectionCard title="Goldpreis österreichisches Gold">
              {visibleRefAustria.length === 0 ? (
                <EmptyState message={buildEmptyStateMessage(searchQuery, onlyFavorites)} />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRefAustria.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            isFavorite={favorites.includes(row.favoriteKey)}
                            onToggle={() => toggleFavorite(row.favoriteKey)}
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
                          <DayChangeCell
                            changeText={row.dayChangeText}
                            changeValue={row.dayChangeValue}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            <SectionCard title="Goldpreis türkisches Gold">
              {visibleRefTurkey.length === 0 ? (
                <EmptyState message={buildEmptyStateMessage(searchQuery, onlyFavorites)} />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis in Euro inkl. Live-Differenz</th>
                      <th style={thStyle}>Preis in Türkischer Lira inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRefTurkey.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            isFavorite={favorites.includes(row.favoriteKey)}
                            onToggle={() => toggleFavorite(row.favoriteKey)}
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
                          <DayChangeCell
                            changeText={row.dayChangeText}
                            changeValue={row.dayChangeValue}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            <SectionCard title="Preisrechner">
              <div style={calculatorGridStyle}>
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
                    placeholder="z. B. 10"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Ausgabe
                  <select
                    value={calculatorCurrency}
                    onChange={(event) => setCalculatorCurrency(event.target.value as Currency)}
                    style={selectStyle}
                  >
                    <option value="EUR">Euro</option>
                    <option value="TRY">Türkische Lira</option>
                  </select>
                </label>
              </div>

              <div style={calculatorResultStyle}>
                {!calculatorResult || calculatorWeightNumber <= 0 ? (
                  <span>Bitte ein gültiges Gewicht eingeben.</span>
                ) : calculatorCurrency === "EUR" ? (
                  <span>
                    Geschätzter Wert:{" "}
                    <strong>{formatCurrency(calculatorResult, "EUR")}</strong>
                  </span>
                ) : (
                  <span>
                    Geschätzter Wert:{" "}
                    <strong>{formatCurrency(calculatorResultTry ?? 0, "TRY")}</strong>
                  </span>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Historischer Verlauf">
              <div style={historyControlRowStyle}>
                <label style={labelStyle}>
                  Produkt wählen
                  <select
                    value={selectedChartKey}
                    onChange={(event) => setSelectedChartKey(event.target.value)}
                    style={selectStyle}
                  >
                    {chartOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <HistoryChart points={selectedChartPoints} selectedLabel={selectedChartLabel} />
            </SectionCard>

            <section style={seoCardStyle}>
              <h2 style={seoTitleStyle}>Über diese Referenzpreise</h2>
              <p style={seoTextStyle}>
                Diese Seite zeigt aktuelle Goldpreise für Österreich, Goldpreis heute,
                Wiener Philharmoniker, Dukaten, Kronen-Gold, Goldbarren sowie türkisches Gold
                in Euro und Lira auf Basis internationaler Spotpreise, Wechselkurse und eigener
                Berechnungen. Die Referenzpreise dienen der Orientierung und stellen keine
                verbindlichen Händlerpreise dar.
              </p>
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

            <SectionCard title="Marktpreis allgemein">
              {visibleMarketGeneral.length === 0 ? (
                <EmptyState message={buildEmptyStateMessage(searchQuery, onlyFavorites)} />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMarketGeneral.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            isFavorite={favorites.includes(row.favoriteKey)}
                            onToggle={() => toggleFavorite(row.favoriteKey)}
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
                          <DayChangeCell
                            changeText={row.dayChangeText}
                            changeValue={row.dayChangeValue}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            <SectionCard title="Marktpreis österreichisches Gold">
              {visibleMarketAustria.length === 0 ? (
                <EmptyState message={buildEmptyStateMessage(searchQuery, onlyFavorites)} />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMarketAustria.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            isFavorite={favorites.includes(row.favoriteKey)}
                            onToggle={() => toggleFavorite(row.favoriteKey)}
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
                          <DayChangeCell
                            changeText={row.dayChangeText}
                            changeValue={row.dayChangeValue}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            <SectionCard title="Marktpreis türkisches Gold">
              {visibleMarketTurkey.length === 0 ? (
                <EmptyState message={buildEmptyStateMessage(searchQuery, onlyFavorites)} />
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={favoriteThStyle}>★</th>
                      <th style={thStyle}>Produkt</th>
                      <th style={thStyle}>Preis in Euro inkl. Live-Differenz</th>
                      <th style={thStyle}>Preis in Türkischer Lira inkl. Live-Differenz</th>
                      <th style={thStyle}>Änderung zum Vortag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMarketTurkey.map((row) => (
                      <tr key={row.id}>
                        <td style={favoriteTdStyle}>
                          <FavoriteButton
                            isFavorite={favorites.includes(row.favoriteKey)}
                            onToggle={() => toggleFavorite(row.favoriteKey)}
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
                          <DayChangeCell
                            changeText={row.dayChangeText}
                            changeValue={row.dayChangeValue}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            <SectionCard title="Preisrechner">
              <div style={calculatorGridStyle}>
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
                    placeholder="z. B. 10"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Ausgabe
                  <select
                    value={calculatorCurrency}
                    onChange={(event) => setCalculatorCurrency(event.target.value as Currency)}
                    style={selectStyle}
                  >
                    <option value="EUR">Euro</option>
                    <option value="TRY">Türkische Lira</option>
                  </select>
                </label>
              </div>

              <div style={calculatorResultStyle}>
                {!calculatorResult || calculatorWeightNumber <= 0 ? (
                  <span>Bitte ein gültiges Gewicht eingeben.</span>
                ) : calculatorCurrency === "EUR" ? (
                  <span>
                    Geschätzter Wert:{" "}
                    <strong>{formatCurrency(calculatorResult, "EUR")}</strong>
                  </span>
                ) : (
                  <span>
                    Geschätzter Wert:{" "}
                    <strong>{formatCurrency(calculatorResultTry ?? 0, "TRY")}</strong>
                  </span>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Historischer Verlauf">
              <div style={historyControlRowStyle}>
                <label style={labelStyle}>
                  Produkt wählen
                  <select
                    value={selectedChartKey}
                    onChange={(event) => setSelectedChartKey(event.target.value)}
                    style={selectStyle}
                  >
                    {chartOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <HistoryChart points={selectedChartPoints} selectedLabel={selectedChartLabel} />
            </SectionCard>

            <section style={seoCardStyle}>
              <h2 style={seoTitleStyle}>Über diese Marktpreise</h2>
              <p style={seoTextStyle}>
                Die Marktpreise sind marktnahe Richtwerte für ausgewählte Goldprodukte
                in Österreich, Wiener Philharmoniker, Dukaten, Goldbarren und türkisches Gold
                wie Gram Altın, Çeyrek Altın oder Gold-Armreife. Sie werden aus Goldpreisdaten,
                Wechselkursen und eigenen modellierten Aufschlägen berechnet und dienen
                ausschließlich der Orientierung.
              </p>
            </section>
          </>
        )}

        <p style={footerSourceStyle}>
          Datenquellen: Goldpreisdaten über externe API, Wechselkursdaten über externe API,
          modellierte Produktaufschläge und eigene Berechnungen.
        </p>

        <p style={updatedStyle}>
          Letztes Update: {updated || "wird geladen …"}
        </p>

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
                E-Mail: {protectedEmailDisplay}
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
                Datenquellen sowie eigenen Berechnungen abgeleitet. Trotz sorgfältiger Erstellung
                und laufender Aktualisierung übernehmen wir keine Gewähr für Richtigkeit,
                Vollständigkeit, Aktualität und Verfügbarkeit der Inhalte.
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
                Die Marktpreise auf dieser Website sind <strong>keine direkt übernommenen Händlerpreise</strong>,
                sondern automatisiert berechnete, marktnahe Richtwerte.
              </p>

              <p>
                <strong>Grundlage der Berechnung:</strong>
                <br />
                Ausgangspunkt ist der internationale Gold-Spotpreis für XAU sowie aktuelle
                Wechselkursdaten für EUR/USD und EUR/TRY.
              </p>

              <p>
                <strong>Referenzpreise:</strong>
                <br />
                Für Referenzpreise werden Feingoldgewicht, Goldreinheit und Wechselkurse direkt
                rechnerisch auf das jeweilige Produkt angewendet.
              </p>

              <p>
                <strong>Marktpreise:</strong>
                <br />
                Für Marktpreise werden auf die Referenzwerte modellierte produktbezogene Aufschläge
                angewendet. Diese Aufschläge unterscheiden sich je nach Produktkategorie, Stückelung,
                Prägeform, Sammler- oder Handelsnähe.
              </p>

              <p>
                <strong>Türkisches Gold:</strong>
                <br />
                Bei türkischem Gold werden zusätzlich Euro- und Lira-Werte berechnet. Produkte mit
                22 Ayar werden mit entsprechend angepasstem Feingoldanteil berücksichtigt.
              </p>

              <p>
                <strong>Wichtig:</strong>
                <br />
                Die so berechneten Marktpreise sind unverbindliche Richtwerte. Reale Händlerpreise
                können aufgrund von Spreads, Gebühren, Nachfrage, Lagerbestand, Ankauf/Verkauf und
                Rundung jederzeit davon abweichen.
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

const seoCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "24px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "24px",
  marginBottom: "16px",
  color: "#111827",
};

const seoTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  marginBottom: "10px",
  color: "#111827",
};

const seoTextStyle: React.CSSProperties = {
  color: "#374151",
  lineHeight: 1.7,
  fontSize: "15px",
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

const emptyStateStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  backgroundColor: "#f9fafb",
  color: "#6b7280",
  textAlign: "center",
  fontWeight: 600,
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

const updatedStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "14px",
  marginTop: "10px",
};

const footerSourceStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "13px",
  marginTop: "8px",
  lineHeight: 1.6,
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

const calculatorGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const calculatorResultStyle: React.CSSProperties = {
  borderRadius: "14px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "16px 18px",
  fontSize: "16px",
  color: "#111827",
};

const historyControlRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "14px",
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

const historyMetaStyle: React.CSSProperties = {
  color: "#6b7280",
  marginTop: "6px",
  fontSize: "13px",
};

const historyStatsStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  color: "#374151",
  fontSize: "14px",
  alignItems: "center",
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