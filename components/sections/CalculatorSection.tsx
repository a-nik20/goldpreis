import { CALCULATOR_PRESETS } from "@/lib/gold/constants";
import {
  calculatorGridStyle,
  calculatorHintStyle,
  calculatorResultStyle,
  cardStyle,
  inputStyle,
  labelStyle,
  sectionTitleStyle,
  selectStyle,
} from "@/lib/gold/styles";
import type { GoldKarat, TabMode } from "@/lib/gold/types";

export default function CalculatorSection({
  calculatorMode,
  setCalculatorMode,
  calculatorKarat,
  setCalculatorKarat,
  calculatorWeight,
  setCalculatorWeight,
  calculatorCurrency,
  setCalculatorCurrency,
  calculatorPreset,
  applyCalculatorPreset,
  eur24Ref,
  eur24Market,
  try24Ref,
  try24Market,
}: {
  calculatorMode: TabMode;
  setCalculatorMode: (v: TabMode) => void;
  calculatorKarat: GoldKarat;
  setCalculatorKarat: (v: GoldKarat) => void;
  calculatorWeight: string;
  setCalculatorWeight: (v: string) => void;
  calculatorCurrency: "EUR" | "TRY";
  setCalculatorCurrency: (v: "EUR" | "TRY") => void;
  calculatorPreset: string;
  applyCalculatorPreset: (v: string) => void;
  eur24Ref: number;
  eur24Market: number;
  try24Ref: number;
  try24Market: number;
}) {
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

  function getKaratLabel(karat: GoldKarat) {
    switch (karat) {
      case 24:
        return "24K (999)";
      case 22:
        return "22K (916)";
      case 18:
        return "18K (750)";
      case 14:
        return "14K (585)";
      case 8:
        return "8K (333)";
    }
  }

  const factor = getKaratFactor(calculatorKarat);

  const eurPerGram =
    (calculatorMode === "ref" ? eur24Ref : eur24Market) * factor;

  const tryPerGram =
    (calculatorMode === "ref" ? try24Ref : try24Market) * factor;

  const weight = Number(calculatorWeight.replace(",", "."));

  const result =
    !Number.isNaN(weight) && weight > 0
      ? calculatorCurrency === "EUR"
        ? eurPerGram * weight
        : tryPerGram * weight
      : null;

  const buy = result !== null ? result * 0.97 : null;
  const sell = result;
  const diff = sell !== null && buy !== null ? sell - buy : null;

  function format(value: number | null) {
    if (value === null) return null;

    return new Intl.NumberFormat("de-AT", {
      style: "currency",
      currency: calculatorCurrency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const formattedSell = format(sell);
  const formattedBuy = format(buy);
  const formattedDiff = format(diff);

  return (
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
            onChange={(event) =>
              setCalculatorKarat(Number(event.target.value) as GoldKarat)
            }
            style={selectStyle}
          >
            <option value={24}>{getKaratLabel(24)}</option>
            <option value={22}>{getKaratLabel(22)}</option>
            <option value={18}>{getKaratLabel(18)}</option>
            <option value={14}>{getKaratLabel(14)}</option>
            <option value={8}>{getKaratLabel(8)}</option>
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
            onChange={(event) =>
              setCalculatorCurrency(event.target.value as "EUR" | "TRY")
            }
            style={selectStyle}
          >
            <option value="EUR">Euro</option>
            <option value="TRY">Türkische Lira</option>
          </select>
        </label>
      </div>

      <div style={calculatorHintStyle}>
        Karat wird automatisch in Feingold umgerechnet (z. B. 18K = 75 % Goldanteil).
      </div>

      <div style={calculatorResultStyle}>
        {sell !== null ? (
          <>
            <div>
              Geschätzter Verkaufswert: <strong>{formattedSell}</strong>
            </div>
            <div>
              Ankauf (realistisch): <strong>{formattedBuy}</strong>
            </div>
            <div>
              Differenz: <strong>{formattedDiff}</strong>
            </div>
          </>
        ) : (
          <>Bitte gültiges Gewicht eingeben.</>
        )}
      </div>
    </section>
  );
}