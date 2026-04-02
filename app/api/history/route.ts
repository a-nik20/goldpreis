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

function getCurrentWeekDates() {
  const now = getViennaNow();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }

  return dates;
}

function getCurrentMonthDates() {
  const now = getViennaNow();
  const year = now.getFullYear();
  const month = now.getMonth();

  const lastDay = new Date(year, month + 1, 0).getDate();
  const dates: Date[] = [];

  for (let day = 1; day <= lastDay; day++) {
    dates.push(new Date(year, month, day));
  }

  return dates;
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chartKey = searchParams.get("chartKey");
    const range = (searchParams.get("range") || "day") as ChartRange;

    if (!chartKey) {
      return Response.json(
        { error: "chartKey fehlt." },
        { status: 400 }
      );
    }

    if (range === "day") {
      const dayKey = getViennaDayKey();
      const redisKey = `gold:intraday:${dayKey}:${chartKey}`;
      const rawEntries = (await redis.lrange(redisKey, 0, -1)) as unknown[] | null;

      const points = (rawEntries ?? [])
        .map(parseIntradayEntry)
        .filter((item): item is IntradayEntry => item !== null)
        .map((entry) => ({
          label: formatIntradayLabel(entry.t),
          value: entry.v,
        }));

      return Response.json({
        chartKey,
        range,
        title: `${cleanTitle(chartKey)} – Tagesansicht`,
        currency: "EUR",
        points,
      });
    }

    if (range === "week") {
      const dates = getCurrentWeekDates();
      const points: Array<{ label: string; value: number }> = [];

      for (const date of dates) {
        const dayKey = getViennaDayKey(date);
        const snapshot =
          ((await redis.get(`gold:close:${dayKey}`)) as Snapshot | null) ?? null;

        const value = resolveSnapshotValue(snapshot, chartKey);
        if (value !== null) {
          points.push({
            label: formatWeekLabel(date),
            value,
          });
        } else {
          points.push({
            label: formatWeekLabel(date),
            value: NaN,
          });
        }
      }

      return Response.json({
        chartKey,
        range,
        title: `${cleanTitle(chartKey)} – Kalenderwoche (Mo–So)`,
        currency: "EUR",
        points: points.filter((point) => !Number.isNaN(point.value)),
      });
    }

    const dates = getCurrentMonthDates();
    const points: Array<{ label: string; value: number }> = [];

    for (const date of dates) {
      const dayKey = getViennaDayKey(date);
      const snapshot =
        ((await redis.get(`gold:close:${dayKey}`)) as Snapshot | null) ?? null;

      const value = resolveSnapshotValue(snapshot, chartKey);
      if (value !== null) {
        points.push({
          label: formatMonthLabel(date),
          value,
        });
      }
    }

    return Response.json({
      chartKey,
      range,
      title: `${cleanTitle(chartKey)} – Kalendermonat`,
      currency: "EUR",
      points,
    });
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