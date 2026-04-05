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
import { ALERTS_KEY, CALCULATOR_PRESETS, FAVORITES_KEY, REFRESH_INTERVAL_MS } from "@/lib/gold/constants";
import { normalizeSearchText, buildSearchAliases } from "@/lib/gold/search";
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
  HistoryResponse,
  LegalTab,
  PricesResponse,
  SingleRow,
  SortKey,
  TabMode,
} from "@/lib/gold/types";

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

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertProduct, setAlertProduct] = useState("");
  const [alertTarget, setAlertTarget] = useState("");
  const [alertDirection, setAlertDirection] = useState<"below" | "above">("below");

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

  const normalizedQuery = normalizeSearchText(query);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];

    return suggestionNames
      .filter((name) => {
        const aliases = buildSearchAliases(name);
        return aliases.some((alias) => alias.includes(normalizedQuery));
      })
      .slice(0, 8);
  }, [suggestionNames, normalizedQuery]);

  function matchesSmartSearch(name: string) {
    if (!normalizedQuery) return true;
    const aliases = buildSearchAliases(name);
    return aliases.some((alias) => alias.includes(normalizedQuery));
  }

  function filterAndSortSingle(rows: SingleRow[]) {
    const filtered = rows.filter((row) => {
      const matchesSearch = matchesSmartSearch(row.name);
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
      const matchesSearch = matchesSmartSearch(row.name);
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

  useEffect(() => {
    if (!("Notification" in window)) return;

    const productMap = new Map<string, number>();

    for (const row of allRows) {
      if ("priceValue" in row) {
        productMap.set(row.name, row.priceValue);
      } else {
        productMap.set(row.name, row.priceEurValue);
      }
    }

    const updatedAlerts = alerts.map((alert) => {
      if (!alert.active) return alert;

      const currentPrice = productMap.get(alert.productName);
      if (currentPrice === undefined) return alert;

      const hitBelow = alert.direction === "below" && currentPrice <= alert.targetPrice;
      const hitAbove = alert.direction === "above" && currentPrice >= alert.targetPrice;

      if (hitBelow || hitAbove) {
        if (Notification.permission === "granted") {
          new Notification("Goldpreis-Alarm", {
            body: `${alert.productName}: ${currentPrice.toFixed(2)} €`,
          });
        }
        return { ...alert, active: false };
      }

      return alert;
    });

    if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
      persistAlerts(updatedAlerts);
    }
  }, [allRows, alerts]);

  const eur24Ref =
    refGeneral.find((row) => row.name === "Gold 1 g (24K Spotpreis)")?.priceValue ?? 0;
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

  const calculatorBuy = calculatorResult !== null ? calculatorResult * 0.975 : null;
  const calculatorSell = calculatorResult !== null ? calculatorResult * 1.0 : null;
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

  async function createAlert() {
    const priceValue = Number(alertTarget.replace(",", "."));
    if (!alertProduct || Number.isNaN(priceValue) || priceValue <= 0) {
      alert("Bitte Produkt und gültigen Zielpreis eingeben.");
      return;
    }

    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
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
        <h1 style={titleStyle}>Goldpreise in Österreich</h1>

        <p style={introStyle}>
          Aktuelle Referenzpreise und marktnahe Richtwerte für Gold in Österreich,
          Wiener Philharmoniker, Dukaten, Goldbarren und türkisches Gold in Euro und Türkischer Lira.
        </p>

        <div style={trustBarStyle}>
          <span>✔ Keine Anlageberatung</span>
          <span>✔ Reine Richtwerte</span>
          <span>✔ Keine Händlertexte kopiert</span>
          <span>✔ Serverseitiges Preisarchiv</span>
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
              Die Prozentänderung vergleicht mit dem lokal gespeicherten Tagesstartwert dieses
              Kalendertags auf deinem Gerät.
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
        />

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

            <PriceTableSection
              title="Goldpreis allgemein"
              rows={visibleRefGeneral}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            <PriceTableSection
              title="Goldpreis österreichisches Gold"
              rows={visibleRefAustria}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            <PriceTableSection
              title="Goldpreis türkisches Gold"
              rows={visibleRefTurkey}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isDual
            />
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

            <PriceTableSection
              title="Marktpreis allgemein"
              rows={visibleMarketGeneral}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            <PriceTableSection
              title="Marktpreis österreichisches Gold"
              rows={visibleMarketAustria}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            <PriceTableSection
              title="Marktpreis türkisches Gold"
              rows={visibleMarketTurkey}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isDual
            />
          </>
        )}

        <CalculatorSection
          calculatorPreset={calculatorPreset}
          applyCalculatorPreset={applyCalculatorPreset}
          calculatorMode={calculatorMode}
          setCalculatorMode={setCalculatorMode}
          calculatorKarat={calculatorKarat}
          setCalculatorKarat={setCalculatorKarat}
          calculatorWeight={calculatorWeight}
          setCalculatorWeight={setCalculatorWeight}
          calculatorCurrency={calculatorCurrency}
          setCalculatorCurrency={setCalculatorCurrency}
          calculatorFormatted={calculatorFormatted}
          calculatorBuyFormatted={calculatorBuyFormatted}
          calculatorSellFormatted={calculatorSellFormatted}
          calculatorSpreadFormatted={calculatorSpreadFormatted}
        />

        <AlertsSection
          allRows={allRows}
          alertProduct={alertProduct}
          setAlertProduct={setAlertProduct}
          alertDirection={alertDirection}
          setAlertDirection={setAlertDirection}
          alertTarget={alertTarget}
          setAlertTarget={setAlertTarget}
          createAlert={createAlert}
          alerts={alerts}
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
          emailDisplay={emailDisplay}
          copyEmail={copyEmail}
        />
      </div>
    </main>
  );
}