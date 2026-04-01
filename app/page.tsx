"use client";

import { useEffect, useRef, useState } from "react";

type RefGeneralRow = {
  name: string;
  price: string;
  liveDiffText: string;
  liveDiffValue: number | null;
  yesterdayChange: string;
  yesterdayChangeValue: number | null;
};

type RefAustriaRow = {
  name: string;
  price: string;
  liveDiffText: string;
  liveDiffValue: number | null;
  yesterdayChange: string;
  yesterdayChangeValue: number | null;
};

type RefTurkeyRow = {
  name: string;
  priceEur: string;
  priceTry: string;
  liveDiffTextEur: string;
  liveDiffValueEur: number | null;
  liveDiffTextTry: string;
  liveDiffValueTry: number | null;
  yesterdayChange: string;
  yesterdayChangeValue: number | null;
};

type MarketGeneralRow = {
  name: string;
  price: string;
  liveDiffText: string;
  liveDiffValue: number | null;
  yesterdayChange: string;
  yesterdayChangeValue: number | null;
};

type MarketAustriaRow = {
  name: string;
  price: string;
  liveDiffText: string;
  liveDiffValue: number | null;
  yesterdayChange: string;
  yesterdayChangeValue: number | null;
};

type MarketTurkeyRow = {
  name: string;
  priceEur: string;
  priceTry: string;
  liveDiffTextEur: string;
  liveDiffValueEur: number | null;
  liveDiffTextTry: string;
  liveDiffValueTry: number | null;
  yesterdayChange: string;
  yesterdayChangeValue: number | null;
};

type RawSnapshot = {
  refGeneral: Record<string, number>;
  refAustria: Record<string, number>;
  refTurkeyEur: Record<string, number>;
  refTurkeyTry: Record<string, number>;
  marketGeneral: Record<string, number>;
  marketAustria: Record<string, number>;
  marketTurkeyEur: Record<string, number>;
  marketTurkeyTry: Record<string, number>;
};

function formatCurrency(value: number, currency: "EUR" | "TRY") {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAbsoluteDiff(value: number | null, currency: "EUR" | "TRY") {
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
  if (previous === null) return null;
  return current - previous;
}

function calcPercentChange(current: number, previous: number | null) {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function getPreviousGoldUsdPerOz(gold: any): number | null {
  const candidates = [
    gold?.prev_close_price,
    gold?.prev_close,
    gold?.previous_close,
    gold?.close_price,
    gold?.close,
    gold?.open_price,
    gold?.open,
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

function YesterdayCell({
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
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "ref" | "market" | "impressum" | "disclaimer"
  >("ref");

  const [refGeneral, setRefGeneral] = useState<RefGeneralRow[]>([]);
  const [refAustria, setRefAustria] = useState<RefAustriaRow[]>([]);
  const [refTurkey, setRefTurkey] = useState<RefTurkeyRow[]>([]);

  const [marketGeneral, setMarketGeneral] = useState<MarketGeneralRow[]>([]);
  const [marketAustria, setMarketAustria] = useState<MarketAustriaRow[]>([]);
  const [marketTurkey, setMarketTurkey] = useState<MarketTurkeyRow[]>([]);

  const [updated, setUpdated] = useState("");
  const [loading, setLoading] = useState(true);

  const previousRef = useRef<RawSnapshot>({
    refGeneral: {},
    refAustria: {},
    refTurkeyEur: {},
    refTurkeyTry: {},
    marketGeneral: {},
    marketAustria: {},
    marketTurkeyEur: {},
    marketTurkeyTry: {},
  });

  async function loadData() {
    try {
      setLoading(true);

      const goldRes = await fetch("https://api.gold-api.com/price/XAU", {
        cache: "no-store",
      });
      const gold = await goldRes.json();

      const today = new Date();
      const fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);

      const from = fromDate.toISOString().slice(0, 10);
      const to = today.toISOString().slice(0, 10);

      const fxRes = await fetch(
        `https://api.frankfurter.dev/v1/${from}..${to}?base=EUR&symbols=USD,TRY`,
        { cache: "no-store" }
      );
      const fxData = await fxRes.json();

      if (!gold?.price || !fxData?.rates) {
        throw new Error("Daten konnten nicht geladen werden.");
      }

      const rateDates = Object.keys(fxData.rates).sort();
      if (rateDates.length < 2) {
        throw new Error("Zu wenige Wechselkursdaten.");
      }

      const latestDate = rateDates[rateDates.length - 1];
      const previousDate = rateDates[rateDates.length - 2];

      const latestRates = fxData.rates[latestDate];
      const previousRates = fxData.rates[previousDate];

      const usdPerEurToday = latestRates?.USD;
      const tryPerEurToday = latestRates?.TRY;
      const usdPerEurYesterday = previousRates?.USD;
      const tryPerEurYesterday = previousRates?.TRY;

      if (
        !usdPerEurToday ||
        !tryPerEurToday ||
        !usdPerEurYesterday ||
        !tryPerEurYesterday
      ) {
        throw new Error("Wechselkurse unvollständig.");
      }

      const goldUsdPerOz = gold.price;
      const previousGoldUsdPerOz = getPreviousGoldUsdPerOz(gold);

      const OUNCE_IN_GRAMS = 31.1034768;

      const goldEurPerOz = goldUsdPerOz / usdPerEurToday;
      const goldTryPerOz = goldEurPerOz * tryPerEurToday;

      const goldEurPerGram24 = goldEurPerOz / OUNCE_IN_GRAMS;
      const goldTryPerGram24 = goldTryPerOz / OUNCE_IN_GRAMS;

      const goldEurPerOzYesterday =
        previousGoldUsdPerOz !== null
          ? previousGoldUsdPerOz / usdPerEurYesterday
          : null;

      const goldTryPerOzYesterday =
        goldEurPerOzYesterday !== null
          ? goldEurPerOzYesterday * tryPerEurYesterday
          : null;

      const goldEurPerGram24Yesterday =
        goldEurPerOzYesterday !== null
          ? goldEurPerOzYesterday / OUNCE_IN_GRAMS
          : null;

      const goldTryPerGram24Yesterday =
        goldTryPerOzYesterday !== null
          ? goldTryPerOzYesterday / OUNCE_IN_GRAMS
          : null;

      const goldEurPerGram22 = goldEurPerGram24 * (22 / 24);
      const goldTryPerGram22 = goldTryPerGram24 * (22 / 24);

      const goldEurPerGram22Yesterday =
        goldEurPerGram24Yesterday !== null
          ? goldEurPerGram24Yesterday * (22 / 24)
          : null;

      const goldTryPerGram22Yesterday =
        goldTryPerGram24Yesterday !== null
          ? goldTryPerGram24Yesterday * (22 / 24)
          : null;

      const prev = previousRef.current;

      const generalItems = [
        { name: "Gold 1 g (24K Spotpreis)", grams24: 1 },
        { name: "Gold 1 oz (24K Spotpreis)", grams24: OUNCE_IN_GRAMS },
        { name: "Goldbarren 1 g", grams24: 1 },
        { name: "Goldbarren 5 g", grams24: 5 },
        { name: "Goldbarren 10 g", grams24: 10 },
        { name: "Goldbarren 50 g", grams24: 50 },
        { name: "Goldbarren 100 g", grams24: 100 },
      ];

      const refGeneralRaw = Object.fromEntries(
        generalItems.map((item) => [item.name, goldEurPerGram24 * item.grams24])
      ) as Record<string, number>;

      const newRefGeneral: RefGeneralRow[] = generalItems.map((item) => {
        const current = refGeneralRaw[item.name];
        const prev60 = prev.refGeneral[item.name] ?? null;
        const prevYesterday =
          goldEurPerGram24Yesterday !== null
            ? goldEurPerGram24Yesterday * item.grams24
            : null;

        const liveDiffValue = calcAbsoluteDiff(current, prev60);
        const yesterdayChangeValue = calcPercentChange(current, prevYesterday);

        return {
          name: item.name,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          yesterdayChange: formatPercent(yesterdayChangeValue),
          yesterdayChangeValue,
        };
      });

      const austriaItems = [
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
      ];

      const refAustriaRaw = Object.fromEntries(
        austriaItems.map((item) => [item.name, goldEurPerGram24 * item.grams24])
      ) as Record<string, number>;

      const newRefAustria: RefAustriaRow[] = austriaItems.map((item) => {
        const current = refAustriaRaw[item.name];
        const prev60 = prev.refAustria[item.name] ?? null;
        const prevYesterday =
          goldEurPerGram24Yesterday !== null
            ? goldEurPerGram24Yesterday * item.grams24
            : null;

        const liveDiffValue = calcAbsoluteDiff(current, prev60);
        const yesterdayChangeValue = calcPercentChange(current, prevYesterday);

        return {
          name: item.name,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          yesterdayChange: formatPercent(yesterdayChangeValue),
          yesterdayChangeValue,
        };
      });

      const CEYREK = 1.75;
      const YARIM = 3.5;
      const TAM = 7.0;
      const RESAT = 7.2;
      const GREMSE = 17.5;
      const BUYUK_RESAT = 36.0;

      const turkeyItems = [
        { name: "Gram Altın (1 g)", grams: 1, karat: 24 },
        { name: "Çeyrek Altın (1,75 g)", grams: CEYREK, karat: 24 },
        { name: "Yarım Altın (3,50 g)", grams: YARIM, karat: 24 },
        { name: "Tam Altın (7,00 g)", grams: TAM, karat: 24 },
        { name: "Reşat Altın (7,20 g)", grams: RESAT, karat: 24 },
        { name: "Gremse Altın (17,50 g)", grams: GREMSE, karat: 24 },
        { name: "Große Reşat Gold (36,00 g)", grams: BUYUK_RESAT, karat: 24 },
        { name: "Gold-Armreif 1 g (22 Ayar)", grams: 1, karat: 22 },
        { name: "Gold-Armreif 10 g (22 Ayar)", grams: 10, karat: 22 },
        { name: "Gold-Armreif 15 g (22 Ayar)", grams: 15, karat: 22 },
        { name: "Gold-Armreif 20 g (22 Ayar)", grams: 20, karat: 22 },
      ];

      const refTurkeyRawEur: Record<string, number> = {};
      const refTurkeyRawTry: Record<string, number> = {};

      const newRefTurkey: RefTurkeyRow[] = turkeyItems.map((item) => {
        const is22 = item.karat === 22;

        const eurPerGram = is22 ? goldEurPerGram22 : goldEurPerGram24;
        const tryPerGram = is22 ? goldTryPerGram22 : goldTryPerGram24;

        const tryPerGramYesterday = is22
          ? goldTryPerGram22Yesterday
          : goldTryPerGram24Yesterday;

        const currentEur = eurPerGram * item.grams;
        const currentTry = tryPerGram * item.grams;

        refTurkeyRawEur[item.name] = currentEur;
        refTurkeyRawTry[item.name] = currentTry;

        const prev60Eur = prev.refTurkeyEur[item.name] ?? null;
        const prev60Try = prev.refTurkeyTry[item.name] ?? null;
        const prevYesterdayTry =
          tryPerGramYesterday !== null ? tryPerGramYesterday * item.grams : null;

        const liveDiffValueEur = calcAbsoluteDiff(currentEur, prev60Eur);
        const liveDiffValueTry = calcAbsoluteDiff(currentTry, prev60Try);
        const yesterdayChangeValue = calcPercentChange(currentTry, prevYesterdayTry);

        return {
          name: item.name,
          priceEur: formatCurrency(currentEur, "EUR"),
          priceTry: formatCurrency(currentTry, "TRY"),
          liveDiffTextEur: formatAbsoluteDiff(liveDiffValueEur, "EUR"),
          liveDiffValueEur,
          liveDiffTextTry: formatAbsoluteDiff(liveDiffValueTry, "TRY"),
          liveDiffValueTry,
          yesterdayChange: formatPercent(yesterdayChangeValue),
          yesterdayChangeValue,
        };
      });

      const marketGeneralRaw: Record<string, number> = {};
      const marketAustriaRaw: Record<string, number> = {};
      const marketTurkeyRawEur: Record<string, number> = {};
      const marketTurkeyRawTry: Record<string, number> = {};

      const newMarketGeneral: MarketGeneralRow[] = generalItems.map((item) => {
        const factor =
          MARKET_PREMIUMS.general[
            item.name as keyof typeof MARKET_PREMIUMS.general
          ] ?? 1;

        const current = refGeneralRaw[item.name] * factor;
        marketGeneralRaw[item.name] = current;

        const prev60 = prev.marketGeneral[item.name] ?? null;
        const prevYesterday =
          goldEurPerGram24Yesterday !== null
            ? goldEurPerGram24Yesterday * item.grams24 * factor
            : null;

        const liveDiffValue = calcAbsoluteDiff(current, prev60);
        const yesterdayChangeValue = calcPercentChange(current, prevYesterday);

        return {
          name: item.name,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          yesterdayChange: formatPercent(yesterdayChangeValue),
          yesterdayChangeValue,
        };
      });

      const newMarketAustria: MarketAustriaRow[] = austriaItems.map((item) => {
        const factor =
          MARKET_PREMIUMS.austria[
            item.name as keyof typeof MARKET_PREMIUMS.austria
          ] ?? 1;

        const current = refAustriaRaw[item.name] * factor;
        marketAustriaRaw[item.name] = current;

        const prev60 = prev.marketAustria[item.name] ?? null;
        const prevYesterday =
          goldEurPerGram24Yesterday !== null
            ? goldEurPerGram24Yesterday * item.grams24 * factor
            : null;

        const liveDiffValue = calcAbsoluteDiff(current, prev60);
        const yesterdayChangeValue = calcPercentChange(current, prevYesterday);

        return {
          name: item.name,
          price: formatCurrency(current, "EUR"),
          liveDiffText: formatAbsoluteDiff(liveDiffValue, "EUR"),
          liveDiffValue,
          yesterdayChange: formatPercent(yesterdayChangeValue),
          yesterdayChangeValue,
        };
      });

      const newMarketTurkey: MarketTurkeyRow[] = turkeyItems.map((item) => {
        const is22 = item.karat === 22;

        const factor = is22
          ? MARKET_PREMIUMS.turkey22k[
              item.name as keyof typeof MARKET_PREMIUMS.turkey22k
            ] ?? 1
          : MARKET_PREMIUMS.turkey24k[
              item.name as keyof typeof MARKET_PREMIUMS.turkey24k
            ] ?? 1;

        const currentEur = refTurkeyRawEur[item.name] * factor;
        const currentTry = refTurkeyRawTry[item.name] * factor;

        marketTurkeyRawEur[item.name] = currentEur;
        marketTurkeyRawTry[item.name] = currentTry;

        const prev60Eur = prev.marketTurkeyEur[item.name] ?? null;
        const prev60Try = prev.marketTurkeyTry[item.name] ?? null;

        let prevYesterdayTry: number | null = null;
        if (is22) {
          prevYesterdayTry =
            goldTryPerGram22Yesterday !== null
              ? goldTryPerGram22Yesterday * item.grams * factor
              : null;
        } else {
          prevYesterdayTry =
            goldTryPerGram24Yesterday !== null
              ? goldTryPerGram24Yesterday * item.grams * factor
              : null;
        }

        const liveDiffValueEur = calcAbsoluteDiff(currentEur, prev60Eur);
        const liveDiffValueTry = calcAbsoluteDiff(currentTry, prev60Try);
        const yesterdayChangeValue = calcPercentChange(currentTry, prevYesterdayTry);

        return {
          name: item.name,
          priceEur: formatCurrency(currentEur, "EUR"),
          priceTry: formatCurrency(currentTry, "TRY"),
          liveDiffTextEur: formatAbsoluteDiff(liveDiffValueEur, "EUR"),
          liveDiffValueEur,
          liveDiffTextTry: formatAbsoluteDiff(liveDiffValueTry, "TRY"),
          liveDiffValueTry,
          yesterdayChange: formatPercent(yesterdayChangeValue),
          yesterdayChangeValue,
        };
      });

      previousRef.current = {
        refGeneral: refGeneralRaw,
        refAustria: refAustriaRaw,
        refTurkeyEur: refTurkeyRawEur,
        refTurkeyTry: refTurkeyRawTry,
        marketGeneral: marketGeneralRaw,
        marketAustria: marketAustriaRaw,
        marketTurkeyEur: marketTurkeyRawEur,
        marketTurkeyTry: marketTurkeyRawTry,
      };

      setRefGeneral(newRefGeneral);
      setRefAustria(newRefAustria);
      setRefTurkey(newRefTurkey);

      setMarketGeneral(newMarketGeneral);
      setMarketAustria(newMarketAustria);
      setMarketTurkey(newMarketTurkey);

      setUpdated(new Date().toLocaleTimeString("de-AT"));
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Goldpreise in Österreich</h1>

        <div style={tabContainer}>
          <button
            onClick={() => setActiveTab("ref")}
            style={{
              ...tabButton,
              ...(activeTab === "ref" ? activeTabStyle : {}),
            }}
          >
            Referenzpreise
          </button>

          <button
            onClick={() => setActiveTab("market")}
            style={{
              ...tabButton,
              ...(activeTab === "market" ? activeTabStyle : {}),
            }}
          >
            Marktpreise
          </button>

          <button
            onClick={() => setActiveTab("impressum")}
            style={{
              ...tabButton,
              ...(activeTab === "impressum" ? activeTabStyle : {}),
            }}
          >
            Impressum
          </button>

          <button
            onClick={() => setActiveTab("disclaimer")}
            style={{
              ...tabButton,
              ...(activeTab === "disclaimer" ? activeTabStyle : {}),
            }}
          >
            Disclaimer
          </button>
        </div>

        {activeTab === "ref" && (
          <>
            <p style={infoStyle}>
              Basierend auf internationalem Gold-Spotpreis (24K). Aktualisierung
              alle 60 Sekunden.
            </p>

            <div style={noticeBoxStyle}>
              <strong>Hinweis:</strong> Alle Angaben auf dieser Website dienen
              ausschließlich Informationszwecken. Trotz sorgfältiger Berechnung
              sind alle Preise unverbindliche Richtwerte und können von
              tatsächlichen Markt-, Händler- oder Ankauf-/Verkaufspreisen
              abweichen.
              <br />
              <br />
              Die dargestellten Referenzpreise werden aus externen Marktdaten und
              Wechselkursen sowie aus eigenen Berechnungen abgeleitet. Es werden
              keine Inhalte, Texte oder Preisangaben einzelner Händler-Websites
              direkt übernommen.
            </div>

            {loading && <p style={loadingStyle}>Preise werden geladen...</p>}

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Goldpreis allgemein</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produkt</th>
                    <th style={thStyle}>Preis</th>
                    <th style={thStyle}>Seit gestern</th>
                  </tr>
                </thead>
                <tbody>
                  {refGeneral.map((row) => (
                    <tr key={row.name}>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>
                        <InlinePrice
                          value={row.price}
                          diffText={row.liveDiffText}
                          diffValue={row.liveDiffValue}
                        />
                      </td>
                      <td style={tdStyle}>
                        <YesterdayCell
                          changeText={row.yesterdayChange}
                          changeValue={row.yesterdayChangeValue}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Goldpreis österreichisches Gold</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produkt</th>
                    <th style={thStyle}>Preis</th>
                    <th style={thStyle}>Seit gestern</th>
                  </tr>
                </thead>
                <tbody>
                  {refAustria.map((row) => (
                    <tr key={row.name}>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>
                        <InlinePrice
                          value={row.price}
                          diffText={row.liveDiffText}
                          diffValue={row.liveDiffValue}
                        />
                      </td>
                      <td style={tdStyle}>
                        <YesterdayCell
                          changeText={row.yesterdayChange}
                          changeValue={row.yesterdayChangeValue}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Goldpreis türkisches Gold</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produkt</th>
                    <th style={thStyle}>Preis in Euro</th>
                    <th style={thStyle}>Preis in Türkischer Lira</th>
                    <th style={thStyle}>Seit gestern</th>
                  </tr>
                </thead>
                <tbody>
                  {refTurkey.map((row) => (
                    <tr key={row.name}>
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
                        <YesterdayCell
                          changeText={row.yesterdayChange}
                          changeValue={row.yesterdayChangeValue}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === "market" && (
          <>
            <p style={infoStyle}>Marktnahe Richtwerte. Aktualisierung alle 60 Sekunden.</p>

            <div style={noticeBoxStyle}>
              <strong>Hinweis:</strong> Alle Angaben auf dieser Website dienen
              ausschließlich Informationszwecken. Trotz sorgfältiger Berechnung
              sind alle Preise unverbindliche Richtwerte und können von
              tatsächlichen Markt-, Händler- oder Ankauf-/Verkaufspreisen
              abweichen.
              <br />
              <br />
              Die dargestellten Marktpreise werden automatisiert aus externen
              Marktdaten sowie eigenen Berechnungen und modellierten Aufschlägen
              abgeleitet. Es werden keine Inhalte, Texte oder Preisangaben
              einzelner Websites direkt übernommen; Abweichungen zu tatsächlichen
              Händlerpreisen sind daher jederzeit möglich.
            </div>

            {loading && <p style={loadingStyle}>Preise werden geladen...</p>}

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Marktpreis allgemein</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produkt</th>
                    <th style={thStyle}>Preis</th>
                    <th style={thStyle}>Seit gestern</th>
                  </tr>
                </thead>
                <tbody>
                  {marketGeneral.map((row) => (
                    <tr key={row.name}>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>
                        <InlinePrice
                          value={row.price}
                          diffText={row.liveDiffText}
                          diffValue={row.liveDiffValue}
                        />
                      </td>
                      <td style={tdStyle}>
                        <YesterdayCell
                          changeText={row.yesterdayChange}
                          changeValue={row.yesterdayChangeValue}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Marktpreis österreichisches Gold</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produkt</th>
                    <th style={thStyle}>Preis</th>
                    <th style={thStyle}>Seit gestern</th>
                  </tr>
                </thead>
                <tbody>
                  {marketAustria.map((row) => (
                    <tr key={row.name}>
                      <td style={tdStyle}>{row.name}</td>
                      <td style={tdStyle}>
                        <InlinePrice
                          value={row.price}
                          diffText={row.liveDiffText}
                          diffValue={row.liveDiffValue}
                        />
                      </td>
                      <td style={tdStyle}>
                        <YesterdayCell
                          changeText={row.yesterdayChange}
                          changeValue={row.yesterdayChangeValue}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Marktpreis türkisches Gold</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produkt</th>
                    <th style={thStyle}>Preis in Euro</th>
                    <th style={thStyle}>Preis in Türkischer Lira</th>
                    <th style={thStyle}>Seit gestern</th>
                  </tr>
                </thead>
                <tbody>
                  {marketTurkey.map((row) => (
                    <tr key={row.name}>
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
                        <YesterdayCell
                          changeText={row.yesterdayChange}
                          changeValue={row.yesterdayChangeValue}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === "impressum" && (
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
                E-Mail: a_nikbay@outlook.com
              </p>
<br />
              <p>
                <strong>Haftungsausschluss:</strong>
                <br />
                Die auf dieser Website dargestellten Preise, Prozentänderungen
                und Marktwerte werden automatisiert aus externen Datenquellen und
                eigenen Berechnungen abgeleitet. Trotz sorgfältiger Erstellung
                übernehmen wir keine Gewähr für Richtigkeit, Vollständigkeit,
                Aktualität oder jederzeitige Verfügbarkeit der Inhalte.
                <br />
                Sämtliche Angaben sind unverbindlich und dienen ausschließlich
                der allgemeinen Information. Eine Haftung für Schäden oder
                Nachteile, die aus der Nutzung der auf dieser Website
                bereitgestellten Informationen entstehen, ist - soweit gesetzlich
                zulässig - ausgeschlossen.
              </p>
<br />
              <p>
                <strong>Keine Anlageberatung:</strong>
                <br />
                Die Inhalte dieser Website stellen weder eine Anlageberatung noch
                eine Kauf-, Verkaufs- oder Investitionsempfehlung dar. Die
                bereitgestellten Informationen ersetzen keine individuelle
                Beratung.
              </p>
<br />
              <p>
                <strong>Zeitstempel-Hinweis:</strong>
                <br />
                Maßgeblich ist immer der zum jeweiligen Zeitpunkt auf der Website
                angezeigte Stand. Kurzfristige Abweichungen zu externen Anbietern
                sind aufgrund von Zeitverzögerungen, Aufschlägen, Spreads und
                Rundungen möglich.
              </p>
<br />
              <p>
                <strong>Zu den Preisangaben:</strong>
                <br />
                Referenzpreise basieren auf internationalen Spotpreisen und
                Wechselkursen. Marktpreise sind angenäherte Richtwerte und können
                von tatsächlichen Händlerpreisen, Ankauf-/Verkaufspreisen sowie
                Produktpreisen einzelner Anbieter abweichen. Preise externer
                Anbieter können eigene Aufschläge, Spreads, Gebühren oder
                produktbezogene Zuschläge enthalten.
                <br />
                <br />
                Diese Website übernimmt keine Inhalte, Texte oder Preisangaben
                einzelner Websites direkt. Die angezeigten Werte werden aus
                externen Marktdaten sowie eigenen Berechnungen abgeleitet.
              </p>
<br />
              <p>
                <strong>Keine Verbindlichkeit:</strong>
                <br />
                Es kommt kein Vertragsverhältnis allein durch die Nutzung dieser
                Website zustande.
              </p>
<br />
              <p>
                <strong>Hinweis zum Datenschutz und zur Kontaktaufnahme:</strong>
                <br />
                Die im Impressum veröffentlichten Kontaktdaten dienen
                ausschließlich der gesetzlich vorgeschriebenen Anbieterkennzeichnung
                und der zulässigen Kontaktaufnahme. Einer missbräuchlichen
                Verwendung, insbesondere zur Übersendung von Werbung, Spam,
                Massenanfragen oder zur sonstigen unbefugten Weiterverarbeitung,
                wird ausdrücklich widersprochen.
              </p>
            </div>
          </section>
        )}

        {activeTab === "disclaimer" && (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Disclaimer</h2>

            <div style={legalTextStyle}>
              <p>
                Die auf dieser Website veröffentlichten Inhalte dienen
                ausschließlich der allgemeinen Information.
              </p>

              <p>
                Die dargestellten Referenzpreise und Marktpreise werden
                automatisiert aus externen Datenquellen sowie eigenen
                Berechnungen abgeleitet. Trotz sorgfältiger Erstellung und
                laufender Aktualisierung übernehmen wir keine Gewähr für
                Richtigkeit, Vollständigkeit, Aktualität und Verfügbarkeit der
                Inhalte.
              </p>

              <p>
                Sämtliche Preisangaben sind unverbindliche Richtwerte.
                Abweichungen zu tatsächlichen Händler-, Ankauf-, Verkauf- oder
                Produktpreisen sind jederzeit möglich. Technische Goldpreisdaten werden über gold-api.com bezogen.
              </p>

              <p>
                Die Inhalte dieser Website stellen keine Anlageberatung,
                Rechtsberatung, Finanzberatung oder Kaufempfehlung dar.
              </p>

              <p>
                Eine Haftung für Schäden oder sonstige Nachteile, die direkt oder
                indirekt aus der Nutzung der auf dieser Website bereitgestellten
                Informationen entstehen, ist - soweit gesetzlich zulässig -
                ausgeschlossen.
              </p>

              <p>
                Zusätzlich gilt: Es werden keine Inhalte, Texte oder
                Preisangaben bestimmter Websites direkt übernommen. Die
                angezeigten Werte basieren auf externen Marktdaten,
                Wechselkursdaten sowie eigenen Berechnungsmodellen und
                Annäherungen.
              </p>
            </div>
          </section>
        )}

<p style={footerSourceStyle}>
  Datenquellen: Externe Goldpreis-API, Wechselkursdaten und eigene Berechnungen.
</p>

        <p style={updatedStyle}>Letztes Update: {updated}</p>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#f5f7fb",
  padding: "30px 15px",
  fontFamily: "Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const titleStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "bold",
  marginBottom: "12px",
  textAlign: "center",
  color: "#1f2937",
};

const infoStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#6b7280",
  marginBottom: "20px",
  fontSize: "15px",
};

const loadingStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "20px",
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

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#1f2937",
  fontSize: "15px",
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
  fontWeight: 600,
};

const activeTabStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

const legalTextStyle: React.CSSProperties = {
  color: "#1f2937",
  lineHeight: 1.7,
  fontSize: "15px",
};

