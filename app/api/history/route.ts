import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChartRange = "day" | "week" | "month";

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

type IntradayEntry = {
  t: number;
  v: number;
};

type HistoryResponse = {
  chartKey: string;
  range: ChartRange;
  title: string;
  currency: "EUR";
  points: Array<{ label: string; value: number }>;
};

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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

function getLastDayKeys(count: number) {
  const now = getViennaNow();
  const dates: Date[] = [];

  for (let offset = count - 1; offset >= 0; offset--) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    dates.push(date);
  }

  return dates.map((date) => ({
    key: getViennaDayKey(date),
    date,
  }));
}

function formatIntradayLabel(timestamp: number) {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatWeekLabel(date: Date) {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function resolveSnapshotValue(snapshot: Snapshot | null, chartKey: string) {
  if (!snapshot) return null;

  const [mode, ...rest] = chartKey.split("::");
  const productName = rest.join("::");

  if (mode === "ref") {
    return (
      snapshot.refGeneral[productName] ??
      snapshot.refAustria[productName] ??
      snapshot.refTurkeyEur[productName] ??
      null
    );
  }

  if (mode === "market") {
    return (
      snapshot.marketGeneral[productName] ??
      snapshot.marketAustria[productName] ??
      snapshot.marketTurkeyEur[productName] ??
      null
    );
  }

  return null;
}

function parseIntradayEntry(entry: unknown): IntradayEntry | null {
  if (!entry) return null;

  if (typeof entry === "string") {
    try {
      const parsed = JSON.parse(entry) as IntradayEntry;
      if (typeof parsed.t === "number" && typeof parsed.v === "number") {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (typeof entry === "object") {
    const candidate = entry as { t?: unknown; v?: unknown };
    if (typeof candidate.t === "number" && typeof candidate.v === "number") {
      return {
        t: candidate.t,
        v: candidate.v,
      };
    }
  }

  return null;
}

function cleanTitle(chartKey: string) {
  return chartKey.replace(/^ref::/, "").replace(/^market::/, "");
}

async function getCachedHistory(cacheKey: string) {
  return ((await redis.get(cacheKey)) as HistoryResponse | null) ?? null;
}

async function setCachedHistory(cacheKey: string, data: HistoryResponse, ttlSeconds: number) {
  await redis.set(cacheKey, data, { ex: ttlSeconds });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chartKey = searchParams.get("chartKey");
    const range = (searchParams.get("range") || "day") as ChartRange;

    if (!chartKey) {
      return Response.json({ error: "chartKey fehlt." }, { status: 400 });
    }

    const todayKey = getViennaDayKey();
    const cacheKey = `gold:history-cache:${todayKey}:${range}:${chartKey}`;
    const cacheTtl = range === "day" ? 15 : 120;

    const cached = await getCachedHistory(cacheKey);
    if (cached) {
      return Response.json(cached);
    }

    if (range === "day") {
      const nowMs = Date.now();
      const fromMs = nowMs - 24 * 60 * 60 * 1000;

      const today = getViennaNow();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const todayKeyLocal = getViennaDayKey(today);
      const yesterdayKey = getViennaDayKey(yesterday);

      const [rawYesterday, rawToday] = await Promise.all([
        redis.lrange(`gold:intraday:${yesterdayKey}:${chartKey}`, 0, -1),
        redis.lrange(`gold:intraday:${todayKeyLocal}:${chartKey}`, 0, -1),
      ]);

      const points = [...(rawYesterday ?? []), ...(rawToday ?? [])]
        .map(parseIntradayEntry)
        .filter((item): item is IntradayEntry => item !== null)
        .filter((entry) => entry.t >= fromMs)
        .sort((a, b) => a.t - b.t)
        .map((entry) => ({
          label: formatIntradayLabel(entry.t),
          value: entry.v,
        }));

      const result: HistoryResponse = {
        chartKey,
        range,
        title: `${cleanTitle(chartKey)} – Letzte 24 Stunden`,
        currency: "EUR",
        points,
      };

      await setCachedHistory(cacheKey, result, cacheTtl);
      return Response.json(result);
    }

    if (range === "week") {
      const days = getLastDayKeys(7);

      const snapshots = await Promise.all(
        days.map(({ key }) => redis.get(`gold:close:${key}`))
      );

      const points = days
        .map(({ date }, index) => {
          const snapshot = (snapshots[index] as Snapshot | null) ?? null;
          const value = resolveSnapshotValue(snapshot, chartKey);

          if (value === null) return null;

          return {
            label: formatWeekLabel(date),
            value,
          };
        })
        .filter((item): item is { label: string; value: number } => item !== null);

      const result: HistoryResponse = {
        chartKey,
        range,
        title: `${cleanTitle(chartKey)} – Letzte 7 Tage`,
        currency: "EUR",
        points,
      };

      await setCachedHistory(cacheKey, result, cacheTtl);
      return Response.json(result);
    }

    const days = getLastDayKeys(30);

    const snapshots = await Promise.all(
      days.map(({ key }) => redis.get(`gold:close:${key}`))
    );

    const points = days
      .map(({ date }, index) => {
        const snapshot = (snapshots[index] as Snapshot | null) ?? null;
        const value = resolveSnapshotValue(snapshot, chartKey);

        if (value === null) return null;

        return {
          label: formatMonthLabel(date),
          value,
        };
      })
      .filter((item): item is { label: string; value: number } => item !== null);

    const result: HistoryResponse = {
      chartKey,
      range,
      title: `${cleanTitle(chartKey)} – Letzte 30 Tage`,
      currency: "EUR",
      points,
    };

    await setCachedHistory(cacheKey, result, cacheTtl);
    return Response.json(result);
  } catch (error) {
    console.error("api/history Fehler:", error);

    return Response.json(
      {
        error: "Verlauf konnte serverseitig nicht geladen werden.",
      },
      { status: 500 }
    );
  }
}