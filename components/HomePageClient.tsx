"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AlertsSection from "@/components/sections/AlertsSection";
import CalculatorSection from "@/components/sections/CalculatorSection";
import FavoritesSection from "@/components/sections/FavoritesSection";
import HistorySection from "@/components/sections/HistorySection";
import LegalSection from "@/components/sections/LegalSection";
import PriceTableSection from "@/components/sections/PriceTableSection";
import SearchToolbar from "@/components/sections/SearchToolbar";
import TrustInfoSection from "@/components/sections/TrustInfoSection";
import LegalTabs from "@/components/tabs/LegalTabs";
import MainTabs from "@/components/tabs/MainTabs";
import {
  ALERTS_KEY,
  CALCULATOR_PRESETS,
  FAVORITES_KEY,
  REFRESH_INTERVAL_MS,
} from "@/lib/gold/constants";
import {
  getRankedSuggestions,
  matchesSmartSearch,
  normalizeSearchText,
} from "@/lib/gold/search";
import {
  containerStyle,
  errorBoxStyle,
  footerSourceStyle,
  infoStyle,
  introStyle,
  loadingBoxStyle,
  noticeBoxStyle,
  pageStyle,
  statusBadgeStyle,
  statusRowStyle,
  statusSubtleStyle,
  titleStyle,
  topInfoCardStyle,
  topInfoGridStyle,
  topInfoTextStyle,
  trustBarStyle,
  updatedStyle,
} from "@/lib/gold/styles";
import type {
  AlertItem,
  ChartRange,
  DualRow,
  GoldKarat,
  HistoryResponse,
  LegalTab,
  PricesResponse,
  SingleRow,
  SortKey,
  TabMode,
} from "@/lib/gold/types";

function detectMobileView() {
  if (typeof window === "undefined") return false;

  const byWidth = window.innerWidth <= 860;
  const byUserAgent =
    /android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry/i.test(
      navigator.userAgent
    );

  return byWidth || byUserAgent;
}

export default function HomePageClient() {
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
  const [favoritesFirst, setFavoritesFirst] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [chartRange, setChartRange] = useState<ChartRange>("day");
  const [selectedChartKey, setSelectedChartKey] = useState("");
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showOnlyFavoriteCharts, setShowOnlyFavoriteCharts] = useState(false);

  const [calculatorMode, setCalculatorMode] = useState<TabMode>("ref");
  const [calculatorKarat, setCalculatorKarat] = useState<GoldKarat>(24);
  const [calculatorWeight, setCalculatorWeight] = useState("10");
  const [calculatorCurrency, setCalculatorCurrency] = useState<"EUR" | "TRY">("EUR");
  const [calculatorPreset, setCalculatorPreset] = useState("Keine Vorlage");

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertProduct, setAlertProduct] = useState("");
  const [alertTarget, setAlertTarget] = useState("");
  const [alertDirection, setAlertDirection] = useState<"below" | "above">("below");

  const [viewMode, setViewMode] = useState<"auto" | "desktop" | "mobile">("auto");
  const [autoMobileDetected, setAutoMobileDetected] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch {
        setFavorites([]);
      }
    }

    const storedAlerts = localStorage.getItem(ALERTS_KEY);
    if (storedAlerts) {
      try {
        setAlerts(JSON.parse(storedAlerts));
      } catch {
        setAlerts([]);
      }
    }
  }, []);

  useEffect(() => {
    function updateDetectedMode() {
      setAutoMobileDetected(detectMobileView());
    }

    updateDetectedMode();
    window.addEventListener("resize", updateDetectedMode);

    return () => window.removeEventListener("resize", updateDetectedMode);
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

  const effectiveViewMode =
    viewMode === "auto" ? (autoMobileDetected ? "mobile" : "desktop") : viewMode;

  function persistFavorites(next: string[]) {
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }

  function persistAlerts(next: AlertItem[]) {
    setAlerts(next);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
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

  const favoriteRows = useMemo(() => {
    return allRows.filter((row) => favorites.includes(row.favoriteKey));
  }, [allRows, favorites]);

  const suggestionNames = useMemo(() => {
    const unique = new Map<string, string>();

    for (const row of allRows) {
      unique.set(normalizeSearchText(row.name), row.name);
    }

    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, "de"));
  }, [allRows]);

  const suggestions = useMemo(() => {
    return getRankedSuggestions(suggestionNames, query, 8);
  }, [suggestionNames, query]);

  function sortWithFavoritePriority<T extends SingleRow | DualRow>(
    rows: T[],
    comparator?: (a: T, b: T) => number
  ) {
    const copy = [...rows];

    copy.sort((a, b) => {
      if (favoritesFirst) {
        const aFav = favorites.includes(a.favoriteKey) ? 1 : 0;
        const bFav = favorites.includes(b.favoriteKey) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
      }

      if (comparator) return comparator(a, b);
      return 0;
    });

    return copy;
  }

  function filterAndSortSingle(rows: SingleRow[]) {
    const filtered = rows.filter((row) => {
      const matchesSearch = matchesSmartSearch(row.name, query);
      const matchesFavorites = onlyFavorites ? favorites.includes(row.favoriteKey) : true;
      return matchesSearch && matchesFavorites;
    });

    switch (sortKey) {
      case "name-asc":
        return sortWithFavoritePriority(filtered, (a, b) => a.name.localeCompare(b.name, "de"));
      case "name-desc":
        return sortWithFavoritePriority(filtered, (a, b) => b.name.localeCompare(a.name, "de"));
      case "price-asc":
        return sortWithFavoritePriority(filtered, (a, b) => a.priceValue - b.priceValue);
      case "price-desc":
        return sortWithFavoritePriority(filtered, (a, b) => b.priceValue - a.priceValue);
      default:
        return sortWithFavoritePriority(filtered);
    }
  }

  function filterAndSortDual(rows: DualRow[]) {
    const filtered = rows.filter((row) => {
      const matchesSearch = matchesSmartSearch(row.name, query);
      const matchesFavorites = onlyFavorites ? favorites.includes(row.favoriteKey) : true;
      return matchesSearch && matchesFavorites;
    });

    switch (sortKey) {
      case "name-asc":
        return sortWithFavoritePriority(filtered, (a, b) => a.name.localeCompare(b.name, "de"));
      case "name-desc":
        return sortWithFavoritePriority(filtered, (a, b) => b.name.localeCompare(a.name, "de"));
      case "price-asc":
        return sortWithFavoritePriority(filtered, (a, b) => a.priceEurValue - b.priceEurValue);
      case "price-desc":
        return sortWithFavoritePriority(filtered, (a, b) => b.priceEurValue - a.priceEurValue);
      default:
        return sortWithFavoritePriority(filtered);
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

  const favoriteChartKeys = useMemo(() => {
    return allRows
      .filter((row) => favorites.includes(row.favoriteKey))
      .map((row) => row.chartKey);
  }, [allRows, favorites]);

  useEffect(() => {
    const visibleChartOptions = showOnlyFavoriteCharts
      ? chartOptions.filter((option) => favoriteChartKeys.includes(option.key))
      : chartOptions;

    if (!visibleChartOptions.length) {
      setSelectedChartKey("");
      return;
    }

    if (
      !selectedChartKey ||
      !visibleChartOptions.some((item) => item.key === selectedChartKey)
    ) {
      setSelectedChartKey(visibleChartOptions[0].key);
    }
  }, [chartOptions, favoriteChartKeys, selectedChartKey, showOnlyFavoriteCharts]);

  useEffect(() => {
    async function loadHistory() {
      if (!selectedChartKey) {
        setHistoryData(null);
        return;
      }

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

  const eur24Ref =
    refGeneral.find((row) => row.name === "Gold 1 g (24K Spotpreis)")?.priceValue ?? 0;
  const eur24Market =
    marketGeneral.find((row) => row.name === "Gold 1 g (24K Spotpreis)")?.priceValue ?? eur24Ref;

  const try24Ref = refTurkey.find((row) => row.name === "Gram Altın (1 g)")?.priceTryValue ?? 0;
  const try24Market =
    marketTurkey.find((row) => row.name === "Gram Altın (1 g)")?.priceTryValue ?? try24Ref;

  function getKaratFactor(karat: GoldKarat) {
    switch (karat) {
      case 24:
        return 1;
      case 22:
        return 22 / 24;
      case 18:
        return 18 / 24;
      case 14:
        return 14 / 24;
      case 8:
        return 8 / 24;
    }
  }

  const karatFactor = getKaratFactor(calculatorKarat);

  const eurPerGram = (calculatorMode === "ref" ? eur24Ref : eur24Market) * karatFactor;
  const tryPerGram = (calculatorMode === "ref" ? try24Ref : try24Market) * karatFactor;

  const weightValue = Number(calculatorWeight.replace(",", "."));
  const calculatorResult =
    !Number.isNaN(weightValue) && weightValue > 0
      ? calculatorCurrency === "EUR"
        ? eurPerGram * weightValue
        : tryPerGram * weightValue
      : null;

  const calculatorBuy = calculatorResult !== null ? calculatorResult * 0.97 : null;
  const calculatorSell = calculatorResult !== null ? calculatorResult : null;
  const calculatorSpread =
    calculatorResult !== null && calculatorBuy !== null && calculatorSell !== null
      ? calculatorSell - calculatorBuy
      : null;

  const calculatorFormatted =
    calculatorResult === null
      ? null
      : new Intl.NumberFormat("de-AT", {
          style: "currency",
          currency: calculatorCurrency,
          maximumFractionDigits: 2,
        }).format(calculatorResult);

  const calculatorBuyFormatted =
    calculatorBuy === null
      ? null
      : new Intl.NumberFormat("de-AT", {
          style: "currency",
          currency: calculatorCurrency,
          maximumFractionDigits: 2,
        }).format(calculatorBuy);

  const calculatorSellFormatted =
    calculatorSell === null
      ? null
      : new Intl.NumberFormat("de-AT", {
          style: "currency",
          currency: calculatorCurrency,
          maximumFractionDigits: 2,
        }).format(calculatorSell);

  const calculatorSpreadFormatted =
    calculatorSpread === null
      ? null
      : new Intl.NumberFormat("de-AT", {
          style: "currency",
          currency: calculatorCurrency,
          maximumFractionDigits: 2,
        }).format(calculatorSpread);

  function applyCalculatorPreset(label: string) {
    setCalculatorPreset(label);

    const preset = CALCULATOR_PRESETS.find((item) => item.label === label);
    if (!preset) return;

    setCalculatorMode(preset.mode);
    setCalculatorKarat(preset.karat);
    setCalculatorWeight(preset.weight);
    setCalculatorCurrency(preset.currency);
  }

  async function createAlert() {
    const priceValue = Number(alertTarget.replace(",", "."));
    if (!alertProduct || Number.isNaN(priceValue) || priceValue <= 0) {
      alert("Bitte Produkt und gültigen Zielpreis eingeben.");
      return;
    }

    const next: AlertItem[] = [
      ...alerts,
      {
        id: `${Date.now()}`,
        productName: alertProduct,
        targetPrice: priceValue,
        direction: alertDirection,
        active: true,
      },
    ];

    persistAlerts(next);
    setAlertTarget("");
  }

  function removeAlert(id: string) {
    persistAlerts(alerts.filter((item) => item.id !== id));
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div
          style={{
            position: "relative",
            marginBottom: "12px",
            minHeight: "74px",
          }}
        >
          <h1
            style={{
              ...titleStyle,
              marginBottom: 0,
              textAlign: "center",
            }}
          >
            Goldpreise in Österreich
          </h1>

          <div
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setViewMode("auto")}
                style={{
                  padding: "5px 9px",
                  fontSize: "13px",
                  borderRadius: 8,
                  border: "1px solid #444",
                  background: viewMode === "auto" ? "#ffd700" : "#222",
                  color: viewMode === "auto" ? "#000" : "#fff",
                  cursor: "pointer",
                }}
              >
                Auto
              </button>

              <button
                onClick={() => setViewMode("desktop")}
                style={{
                  padding: "5px 9px",
                  fontSize: "13px",
                  borderRadius: 8,
                  border: "1px solid #444",
                  background: viewMode === "desktop" ? "#ffd700" : "#222",
                  color: viewMode === "desktop" ? "#000" : "#fff",
                  cursor: "pointer",
                }}
              >
                Desktop
              </button>

              <button
                onClick={() => setViewMode("mobile")}
                style={{
                  padding: "5px 9px",
                  fontSize: "13px",
                  borderRadius: 8,
                  border: "1px solid #444",
                  background: viewMode === "mobile" ? "#ffd700" : "#222",
                  color: viewMode === "mobile" ? "#000" : "#fff",
                  cursor: "pointer",
                }}
              >
                Mobil
              </button>
            </div>

            <div style={{ fontSize: 11, opacity: 0.72 }}>
              Automatisch erkannt: {autoMobileDetected ? "Mobil" : "Desktop"}
            </div>
          </div>
        </div>

        <p style={introStyle}>
          Aktuelle Referenzpreise und marktnahe Richtwerte für Gold in Österreich,
          Wiener Philharmoniker, Dukaten, Goldbarren und türkisches Gold in Euro und Türkischer Lira.
        </p>

        <div style={trustBarStyle}>
          <span>✔ Keine Anlageberatung</span>
          <span>✔ Reine Richtwerte</span>
        </div>

        <MainTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setLegalTab={setLegalTab}
        />

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
              Die Preisänderung vergleicht mit dem serverseitig gespeicherten Tagesstartwert.
            </p>
          </div>
        </div>

        <FavoritesSection
          favoriteRows={favoriteRows}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />

        <SearchToolbar
          searchBoxRef={searchBoxRef}
          query={query}
          setQuery={setQuery}
          setShowSuggestions={setShowSuggestions}
          showSuggestions={showSuggestions}
          suggestions={suggestions}
          sortKey={sortKey}
          setSortKey={setSortKey}
          onlyFavorites={onlyFavorites}
          setOnlyFavorites={setOnlyFavorites}
          onRefresh={() => loadPrices(false)}
          favoritesFirst={favoritesFirst}
          setFavoritesFirst={setFavoritesFirst}
        />

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "-4px",
            marginBottom: "18px",
          }}
        >
          <a
            href="#goldpreis-allgemein"
            style={{
              padding: "9px 14px",
              borderRadius: "999px",
              backgroundColor: "#e5e7eb",
              color: "#111827",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Goldpreis allgemein
          </a>

          <a
            href="#goldpreis-oesterreich"
            style={{
              padding: "9px 14px",
              borderRadius: "999px",
              backgroundColor: "#e5e7eb",
              color: "#111827",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Österreichisches Gold
          </a>

          <a
            href="#goldpreis-tuerkei"
            style={{
              padding: "9px 14px",
              borderRadius: "999px",
              backgroundColor: "#e5e7eb",
              color: "#111827",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Türkisches Gold
          </a>
        </div>

        <div style={statusRowStyle}>
          <span style={statusBadgeStyle}>
            {backgroundUpdating
              ? "Aktualisierung läuft …"
              : "Automatische Aktualisierung alle 15 Sekunden"}
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

            {loading && <div style={loadingBoxStyle}>🔄 Aktuelle Preise werden geladen …</div>}

            <PriceTableSection
              title="Goldpreis allgemein"
              rows={visibleRefGeneral}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              viewMode={effectiveViewMode}
              sectionId="goldpreis-allgemein"
            />

            <PriceTableSection
              title="Goldpreis österreichisches Gold"
              rows={visibleRefAustria}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              viewMode={effectiveViewMode}
              sectionId="goldpreis-oesterreich"
            />

            <PriceTableSection
              title="Goldpreis türkisches Gold"
              rows={visibleRefTurkey}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isDual
              viewMode={effectiveViewMode}
              sectionId="goldpreis-tuerkei"
            />
          </>
        )}

        {activeTab === "market" && (
          <>
            <p style={infoStyle}>Marktnahe Richtwerte. Aktualisierung alle 15 Sekunden.</p>

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

            {loading && <div style={loadingBoxStyle}>🔄 Aktuelle Preise werden geladen …</div>}

            <PriceTableSection
              title="Marktpreis allgemein"
              rows={visibleMarketGeneral}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              viewMode={effectiveViewMode}
              sectionId="goldpreis-allgemein"
            />

            <PriceTableSection
              title="Marktpreis österreichisches Gold"
              rows={visibleMarketAustria}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              viewMode={effectiveViewMode}
              sectionId="goldpreis-oesterreich"
            />

            <PriceTableSection
              title="Marktpreis türkisches Gold"
              rows={visibleMarketTurkey}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isDual
              viewMode={effectiveViewMode}
              sectionId="goldpreis-tuerkei"
            />
          </>
        )}

        <CalculatorSection
          calculatorMode={calculatorMode}
          setCalculatorMode={setCalculatorMode}
          calculatorKarat={calculatorKarat}
          setCalculatorKarat={setCalculatorKarat}
          calculatorWeight={calculatorWeight}
          setCalculatorWeight={setCalculatorWeight}
          calculatorCurrency={calculatorCurrency}
          setCalculatorCurrency={setCalculatorCurrency}
          calculatorPreset={calculatorPreset}
          applyCalculatorPreset={applyCalculatorPreset}
          eur24Ref={eur24Ref}
          eur24Market={eur24Market}
          try24Ref={try24Ref}
          try24Market={try24Market}
        />

        <AlertsSection
          alerts={alerts}
          allRows={allRows}
          alertProduct={alertProduct}
          setAlertProduct={setAlertProduct}
          alertTarget={alertTarget}
          setAlertTarget={setAlertTarget}
          alertDirection={alertDirection}
          setAlertDirection={setAlertDirection}
          createAlert={createAlert}
          removeAlert={removeAlert}
        />

        <HistorySection
          selectedChartKey={selectedChartKey}
          setSelectedChartKey={setSelectedChartKey}
          chartOptions={chartOptions}
          chartRange={chartRange}
          setChartRange={setChartRange}
          historyLoading={historyLoading}
          historyData={historyData}
          favoriteChartKeys={favoriteChartKeys}
          showOnlyFavoriteCharts={showOnlyFavoriteCharts}
          setShowOnlyFavoriteCharts={setShowOnlyFavoriteCharts}
        />

        <TrustInfoSection />

        <p style={footerSourceStyle}>
          Datenquellen: Goldpreisdaten über externe API, Wechselkursdaten über externe API,
          serverseitiges Archiv, modellierte Produktaufschläge und eigene Berechnungen.
        </p>

        <p style={updatedStyle}>Letztes Update: {updatedAt || "wird geladen …"}</p>

        <LegalTabs legalTab={legalTab} setLegalTab={setLegalTab} />

        <LegalSection
          legalTab={legalTab}
          emailDisplay="a_nikbay [at] outlook [dot] com"
          copyEmail={() => {}}
        />
      </div>
    </main>
  );
}