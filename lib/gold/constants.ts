import type { CalculatorPreset } from "@/lib/gold/types";

export const REFRESH_INTERVAL_MS = 15000;
export const FAVORITES_KEY = "goldpreis_favorites_v6";
export const ALERTS_KEY = "goldpreis_alerts_v1";

export const CALCULATOR_PRESETS: CalculatorPreset[] = [
  { label: "Keine Vorlage", mode: "ref", karat: 24, weight: "10", currency: "EUR" },

  { label: "Gold 1 g (24K Spotpreis)", mode: "ref", karat: 24, weight: "1", currency: "EUR" },
  { label: "Gold 1 oz (24K Spotpreis)", mode: "ref", karat: 24, weight: "31.1034768", currency: "EUR" },

  { label: "Goldbarren 1 g", mode: "market", karat: 24, weight: "1", currency: "EUR" },
  { label: "Goldbarren 5 g", mode: "market", karat: 24, weight: "5", currency: "EUR" },
  { label: "Goldbarren 10 g", mode: "market", karat: 24, weight: "10", currency: "EUR" },
  { label: "Goldbarren 50 g", mode: "market", karat: 24, weight: "50", currency: "EUR" },
  { label: "Goldbarren 100 g", mode: "market", karat: 24, weight: "100", currency: "EUR" },

  { label: "Wiener Philharmoniker 1 oz", mode: "market", karat: 24, weight: "31.1034768", currency: "EUR" },
  { label: "Wiener Philharmoniker 1/2 oz", mode: "market", karat: 24, weight: "15.5517384", currency: "EUR" },
  { label: "Wiener Philharmoniker 1/4 oz", mode: "market", karat: 24, weight: "7.7758692", currency: "EUR" },
  { label: "Wiener Philharmoniker 1/10 oz", mode: "market", karat: 24, weight: "3.11034768", currency: "EUR" },
  { label: "Wiener Philharmoniker 1/25 oz", mode: "market", karat: 24, weight: "1.244139072", currency: "EUR" },

  { label: "Franz Joseph 1-fach Dukat (3,44 g fein)", mode: "market", karat: 24, weight: "3.44", currency: "EUR" },
  { label: "Franz Joseph 4-fach Dukat (13,77 g fein)", mode: "market", karat: 24, weight: "13.77", currency: "EUR" },
  { label: "10 Kronen Gold (3,05 g fein)", mode: "market", karat: 24, weight: "3.05", currency: "EUR" },
  { label: "20 Kronen Gold (6,10 g fein)", mode: "market", karat: 24, weight: "6.1", currency: "EUR" },
  { label: "100 Kronen Gold (30,49 g fein)", mode: "market", karat: 24, weight: "30.49", currency: "EUR" },
  { label: "Vier Gulden Gold (2,90 g fein)", mode: "market", karat: 24, weight: "2.9", currency: "EUR" },
  { label: "Acht Gulden Gold (5,81 g fein)", mode: "market", karat: 24, weight: "5.81", currency: "EUR" },

  { label: "Gram Altın (1 g)", mode: "ref", karat: 24, weight: "1", currency: "EUR" },
  { label: "Çeyrek Altın (1,75 g)", mode: "ref", karat: 24, weight: "1.75", currency: "EUR" },
  { label: "Yarım Altın (3,50 g)", mode: "ref", karat: 24, weight: "3.5", currency: "EUR" },
  { label: "Tam Altın (7,00 g)", mode: "ref", karat: 24, weight: "7", currency: "EUR" },
  { label: "Reşat Altın (7,20 g)", mode: "ref", karat: 24, weight: "7.2", currency: "EUR" },
  { label: "Gremse Altın (17,50 g)", mode: "ref", karat: 24, weight: "17.5", currency: "EUR" },
  { label: "Große Reşat Gold (36,00 g)", mode: "ref", karat: 24, weight: "36", currency: "EUR" },

  { label: "Gold-Armreif 1 g (22 Ayar)", mode: "ref", karat: 22, weight: "1", currency: "EUR" },
  { label: "Gold-Armreif 10 g (22 Ayar)", mode: "ref", karat: 22, weight: "10", currency: "EUR" },
  { label: "Gold-Armreif 15 g (22 Ayar)", mode: "ref", karat: 22, weight: "15", currency: "EUR" },
  { label: "Gold-Armreif 20 g (22 Ayar)", mode: "ref", karat: 22, weight: "20", currency: "EUR" },
];