import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Currency = "EUR" | "TRY";
type ProductMode = "ref" | "market";

type BaseRow = {
  id: string;
  name: string;
  favoriteKey: string;
  chartKey: string;
  dayStartValue: number | null;
  dayStartText: string;
};

type SingleRow = BaseRow & {
  price: string;
  priceValue: number;
  liveDiffText: string;
  liveDiffValue: number | null;
  dayDiffText: string;
  dayDiffValue: number | null;
  buyPrice: string;
  buyPriceValue: number;
  sellPrice: string;
  sellPriceValue: number;
  spreadText: string;
  spreadValue: number;
};

type DualRow = BaseRow & {
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
  buyPriceEur: string;
  buyPriceEurValue: number;
  sellPriceEur: string;
  sellPriceEurValue: number;
  spreadTextEur: string;
  spreadValueEur: number;
};

type Snapshot = {
  refGeneral: Record<string, number>;
  refAustria: Record<string, number>;
  refTurkeyEur: Record<string, number>;
  refTurkeyTry: Record<string, number>;
  marketGeneral: Record<string, number>;
  marketAustria: Record<string, number>;
  marketTurkeyEur: Record<string, number>;
  marketTurkeyTry: Record<string, number>;
};

type GoldApiResponse = {
  price?: number;
};

type FxLatestResponse = {
  rates?: {
    USD?: number;
    TRY?: number;
  };
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

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const OUNCE_IN_GRAMS = 31.1034768;
const SNAPSHOT_CACHE_SECONDS = 10;
const RESPONSE_CACHE_SECONDS = 10;

/**
 * Markt-Aufschläge für modellierte Verkaufspreise
 */
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

function createEmptySnapshot(): Snapshot {
  return {
    refGeneral: {},
    refAustria: {},
    refTurkeyEur: {},
    refTurkeyTry: {},
    marketGeneral: {},
    marketAustria: {},
    marketTurkeyEur: {},
    marketTurkeyTry: {},
  };
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

function calcAbsoluteDiff(current: number, previous: number | null) {
  if (previous === null || Number.isNaN(previous)) return null;
  return current - previous;
}

function getViennaNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Vienna" }));
}

function getViennaDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getYesterdayKey() {
  const viennaNow = getViennaNow();
  viennaNow.setDate(viennaNow.getDate() - 1);
  return getViennaDayKey(viennaNow);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fehler beim Laden: ${url}`);
  }
  return (await response.json()) as T;
}

async function fetchFreshSnapshot(): Promise<Snapshot> {
  const [gold, fx] = await Promise.all([
    fetchJson<GoldApiResponse>("https://api.gold-api.com/price/XAU"),
    fetchJson<FxLatestResponse>("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,TRY"),
  ]);

  if (!gold?.price || !fx?.rates?.USD || !fx?.rates?.TRY) {
    throw new Error("Unvollständige externe Daten.");
  }

  const usdPerEur = fx.rates.USD;
  const tryPerEur = fx.rates.TRY;

  const goldUsdPerOz = gold.price;
  const goldEurPerOz = goldUsdPerOz / usdPerEur;
  const goldTryPerOz = goldEurPerOz * tryPerEur;

  const goldEurPerGram24 = goldEurPerOz / OUNCE_IN_GRAMS;
  const goldTryPerGram24 = goldTryPerOz / OUNCE_IN_GRAMS;

  const goldEurPerGram22 = goldEurPerGram24 * (22 / 24);
  const goldTryPerGram22 = goldTryPerGram24 * (22 / 24);

  const snapshot = createEmptySnapshot();

  for (const item of GENERAL_ITEMS) {
    snapshot.refGeneral[item.name] = goldEurPerGram24 * item.grams24;
  }

  for (const item of AUSTRIA_ITEMS) {
    snapshot.refAustria[item.name] = goldEurPerGram24 * item.grams24;
  }

  for (const item of TURKEY_ITEMS) {
    const eurPerGram = item.karat === 22 ? goldEurPerGram22 : goldEurPerGram24;
    const tryPerGram = item.karat === 22 ? goldTryPerGram22 : goldTryPerGram24;

    snapshot.refTurkeyEur[item.name] = eurPerGram * item.grams;
    snapshot.refTurkeyTry[item.name] = tryPerGram * item.grams;
  }

  for (const item of GENERAL_ITEMS) {
    const factor = MARKET_PREMIUMS.general[item.name] ?? 1;
    snapshot.marketGeneral[item.name] = snapshot.refGeneral[item.name] * factor;
  }

  for (const item of AUSTRIA_ITEMS) {
    const factor = MARKET_PREMIUMS.austria[item.name] ?? 1;
    snapshot.marketAustria[item.name] = snapshot.refAustria[item.name] * factor;
  }

  for (const item of TURKEY_ITEMS) {
    const factor =
      item.karat === 22
        ? MARKET_PREMIUMS.turkey22k[item.name as keyof typeof MARKET_PREMIUMS.turkey22k] ?? 1
        : MARKET_PREMIUMS.turkey24k[item.name as keyof typeof MARKET_PREMIUMS.turkey24k] ?? 1;

    snapshot.marketTurkeyEur[item.name] = snapshot.refTurkeyEur[item.name] * factor;
    snapshot.marketTurkeyTry[item.name] = snapshot.refTurkeyTry[item.name] * factor;
  }

  return snapshot;
}

async function buildSnapshot(): Promise<Snapshot> {
  const cacheKey = "gold:snapshot-cache:v1";
  const cached = ((await redis.get(cacheKey)) as Snapshot | null) ?? null;
  if (cached) return cached;

  const snapshot = await fetchFreshSnapshot();
  await redis.set(cacheKey, snapshot, { ex: SNAPSHOT_CACHE_SECONDS });
  return snapshot;
}

async function appendIntradayHistory(dayKey: string, chartKey: string, value: number) {
  const entry = JSON.stringify({
    t: Date.now(),
    v: value,
  });

  const redisKey = `gold:intraday:${dayKey}:${chartKey}`;

  await Promise.all([redis.rpush(redisKey, entry), redis.ltrim(redisKey, -8000, -1)]);
}

function getTypeFromName(name: string) {
  const isJewelry =
    name.includes("Armreif") ||
    name.includes("Dukat") ||
    name.includes("Kronen") ||
    name.includes("Gulden");

  return { isJewelry };
}

function getBuyAndSellValues(currentValue: number, name: string) {
  const { isJewelry } = getTypeFromName(name);

  // Verkaufspreis wieder wie früher = aktueller Preis
  const sellValue = currentValue;

  // Ankauf realistisch niedriger
  const buyDiscount = isJewelry ? 0.10 : 0.03;
  const buyValue = currentValue * (1 - buyDiscount);

  const differenceValue = sellValue - buyValue;

  return {
    buyValue,
    sellValue,
    differenceValue,
  };
}

function buildSingleRow(
  prefix: string,
  mode: ProductMode,
  name: string,
  currentValue: number,
  previousLiveValue: number | null,
  dayStartValue: number | null
): SingleRow {
  const liveDiff = calcAbsoluteDiff(currentValue, previousLiveValue);
  const dayDiff = calcAbsoluteDiff(currentValue, dayStartValue);

  const { buyValue, sellValue, differenceValue } = getBuyAndSellValues(currentValue, name);

  return {
    id: `${prefix}-${name}`,
    name,
    favoriteKey: `${prefix}::${name}`,
    chartKey: `${mode}::${name}`,
    dayStartValue,
    dayStartText: dayStartValue === null ? "–" : formatCurrency(dayStartValue, "EUR"),
    price: formatCurrency(currentValue, "EUR"),
    priceValue: currentValue,
    liveDiffText: formatAbsoluteDiff(liveDiff, "EUR"),
    liveDiffValue: liveDiff,
    dayDiffText: formatAbsoluteDiff(dayDiff, "EUR"),
    dayDiffValue: dayDiff,
    buyPrice: formatCurrency(buyValue, "EUR"),
    buyPriceValue: buyValue,
    sellPrice: formatCurrency(sellValue, "EUR"),
    sellPriceValue: sellValue,
    spreadText: formatCurrency(differenceValue, "EUR"),
    spreadValue: differenceValue,
  };
}

function buildDualRow(
  prefix: string,
  mode: ProductMode,
  name: string,
  currentEur: number,
  currentTry: number,
  previousLiveEur: number | null,
  previousLiveTry: number | null,
  dayStartEur: number | null
): DualRow {
  const liveDiffEur = calcAbsoluteDiff(currentEur, previousLiveEur);
  const liveDiffTry = calcAbsoluteDiff(currentTry, previousLiveTry);
  const dayDiff = calcAbsoluteDiff(currentEur, dayStartEur);

  const { buyValue, sellValue, differenceValue } = getBuyAndSellValues(currentEur, name);

  return {
    id: `${prefix}-${name}`,
    name,
    favoriteKey: `${prefix}::${name}`,
    chartKey: `${mode}::${name}`,
    dayStartValue: dayStartEur,
    dayStartText: dayStartEur === null ? "–" : formatCurrency(dayStartEur, "EUR"),
    priceEur: formatCurrency(currentEur, "EUR"),
    priceEurValue: currentEur,
    priceTry: formatCurrency(currentTry, "TRY"),
    priceTryValue: currentTry,
    liveDiffTextEur: formatAbsoluteDiff(liveDiffEur, "EUR"),
    liveDiffValueEur: liveDiffEur,
    liveDiffTextTry: formatAbsoluteDiff(liveDiffTry, "TRY"),
    liveDiffValueTry: liveDiffTry,
    dayDiffText: formatAbsoluteDiff(dayDiff, "EUR"),
    dayDiffValue: dayDiff,
    buyPriceEur: formatCurrency(buyValue, "EUR"),
    buyPriceEurValue: buyValue,
    sellPriceEur: formatCurrency(sellValue, "EUR"),
    sellPriceEurValue: sellValue,
    spreadTextEur: formatCurrency(differenceValue, "EUR"),
    spreadValueEur: differenceValue,
  };
}

function buildRows(current: Snapshot, previousLive: Snapshot, dayBaseline: Snapshot) {
  const refGeneral: SingleRow[] = GENERAL_ITEMS.map((item) =>
    buildSingleRow(
      "refGeneral",
      "ref",
      item.name,
      current.refGeneral[item.name],
      previousLive.refGeneral[item.name] ?? null,
      dayBaseline.refGeneral[item.name] ?? null
    )
  );

  const refAustria: SingleRow[] = AUSTRIA_ITEMS.map((item) =>
    buildSingleRow(
      "refAustria",
      "ref",
      item.name,
      current.refAustria[item.name],
      previousLive.refAustria[item.name] ?? null,
      dayBaseline.refAustria[item.name] ?? null
    )
  );

  const refTurkey: DualRow[] = TURKEY_ITEMS.map((item) =>
    buildDualRow(
      "refTurkey",
      "ref",
      item.name,
      current.refTurkeyEur[item.name],
      current.refTurkeyTry[item.name],
      previousLive.refTurkeyEur[item.name] ?? null,
      previousLive.refTurkeyTry[item.name] ?? null,
      dayBaseline.refTurkeyEur[item.name] ?? null
    )
  );

  const marketGeneral: SingleRow[] = GENERAL_ITEMS.map((item) =>
    buildSingleRow(
      "marketGeneral",
      "market",
      item.name,
      current.marketGeneral[item.name],
      previousLive.marketGeneral[item.name] ?? null,
      dayBaseline.marketGeneral[item.name] ?? null
    )
  );

  const marketAustria: SingleRow[] = AUSTRIA_ITEMS.map((item) =>
    buildSingleRow(
      "marketAustria",
      "market",
      item.name,
      current.marketAustria[item.name],
      previousLive.marketAustria[item.name] ?? null,
      dayBaseline.marketAustria[item.name] ?? null
    )
  );

  const marketTurkey: DualRow[] = TURKEY_ITEMS.map((item) =>
    buildDualRow(
      "marketTurkey",
      "market",
      item.name,
      current.marketTurkeyEur[item.name],
      current.marketTurkeyTry[item.name],
      previousLive.marketTurkeyEur[item.name] ?? null,
      previousLive.marketTurkeyTry[item.name] ?? null,
      dayBaseline.marketTurkeyEur[item.name] ?? null
    )
  );

  return {
    refGeneral,
    refAustria,
    refTurkey,
    marketGeneral,
    marketAustria,
    marketTurkey,
  };
}

export async function GET() {
  try {
    const dayKey = getViennaDayKey();
    const yesterdayKey = getYesterdayKey();
    const responseCacheKey = `gold:response-cache:${dayKey}`;

    const cachedResponse = ((await redis.get(responseCacheKey)) as PricesResponse | null) ?? null;
    if (cachedResponse) {
      return Response.json(cachedResponse);
    }

    const currentSnapshot = await buildSnapshot();

    const [previousLiveRaw, dayBaselineRaw] = await Promise.all([
      redis.get(`gold:latest:${dayKey}`),
      redis.get(`gold:baseline:${dayKey}`),
    ]);

    const previousLive = (previousLiveRaw as Snapshot | null) ?? createEmptySnapshot();

    let dayBaseline = (dayBaselineRaw as Snapshot | null) ?? null;

    if (!dayBaseline) {
      dayBaseline =
        ((await redis.get(`gold:close:${yesterdayKey}`)) as Snapshot | null) ?? currentSnapshot;

      await redis.set(`gold:baseline:${dayKey}`, dayBaseline);
    }

    const rows = buildRows(currentSnapshot, previousLive, dayBaseline);

    const updatedAt = new Date().toLocaleString("de-AT", {
      timeZone: "Europe/Vienna",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const responsePayload: PricesResponse = {
      ...rows,
      updatedAt,
      statusText: "Serverdaten erfolgreich aktualisiert.",
    };

    const writePromises: Promise<unknown>[] = [
      redis.set(`gold:latest:${dayKey}`, currentSnapshot),
      redis.set(`gold:close:${dayKey}`, currentSnapshot),
      redis.set(responseCacheKey, responsePayload, { ex: RESPONSE_CACHE_SECONDS }),
    ];

    for (const item of GENERAL_ITEMS) {
      writePromises.push(
        appendIntradayHistory(dayKey, `ref::${item.name}`, currentSnapshot.refGeneral[item.name])
      );
      writePromises.push(
        appendIntradayHistory(dayKey, `market::${item.name}`, currentSnapshot.marketGeneral[item.name])
      );
    }

    for (const item of AUSTRIA_ITEMS) {
      writePromises.push(
        appendIntradayHistory(dayKey, `ref::${item.name}`, currentSnapshot.refAustria[item.name])
      );
      writePromises.push(
        appendIntradayHistory(dayKey, `market::${item.name}`, currentSnapshot.marketAustria[item.name])
      );
    }

    for (const item of TURKEY_ITEMS) {
      writePromises.push(
        appendIntradayHistory(dayKey, `ref::${item.name}`, currentSnapshot.refTurkeyEur[item.name])
      );
      writePromises.push(
        appendIntradayHistory(dayKey, `market::${item.name}`, currentSnapshot.marketTurkeyEur[item.name])
      );
    }

    await Promise.all(writePromises);

    return Response.json(responsePayload);
  } catch (error) {
    console.error("api/prices Fehler:", error);

    return Response.json(
      {
        error: "Preise konnten serverseitig nicht geladen werden.",
      },
      { status: 500 }
    );
  }
}