export type TabMode = "ref" | "market";
export type LegalTab = "none" | "impressum" | "disclaimer" | "calculation";
export type SortKey = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc";
export type ChartRange = "day" | "week" | "month";

export type GoldKarat = 24 | 22 | 18 | 14 | 8;

export type BaseRow = {
  id: string;
  name: string;
  favoriteKey: string;
  chartKey: string;
  dayStartValue: number | null;
  dayStartText: string;
};

export type SingleRow = BaseRow & {
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

export type DualRow = BaseRow & {
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

export type PricesResponse = {
  refGeneral: SingleRow[];
  refAustria: SingleRow[];
  refTurkey: DualRow[];
  marketGeneral: SingleRow[];
  marketAustria: SingleRow[];
  marketTurkey: DualRow[];
  updatedAt: string;
  statusText: string;
};

export type HistoryPoint = {
  label: string;
  value: number;
};

export type HistoryResponse = {
  chartKey: string;
  range: ChartRange;
  title: string;
  currency: "EUR";
  points: HistoryPoint[];
};

export type AlertItem = {
  id: string;
  productName: string;
  targetPrice: number;
  direction: "below" | "above";
  active: boolean;
};

export type CalculatorPreset = {
  label: string;
  mode: TabMode;
  karat: GoldKarat;
  weight: string;
  currency: "EUR" | "TRY";
};