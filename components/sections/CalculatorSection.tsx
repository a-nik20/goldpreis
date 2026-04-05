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
import type { TabMode } from "@/lib/gold/types";

export default function CalculatorSection({
  calculatorPreset,
  applyCalculatorPreset,
  calculatorMode,
  setCalculatorMode,
  calculatorKarat,
  setCalculatorKarat,
  calculatorWeight,
  setCalculatorWeight,
  calculatorCurrency,
  setCalculatorCurrency,
  calculatorFormatted,
  calculatorBuyFormatted,
  calculatorSellFormatted,
  calculatorSpreadFormatted,
}: {
  calculatorPreset: string;
  applyCalculatorPreset: (label: string) => void;
  calculatorMode: TabMode;
  setCalculatorMode: (value: TabMode) => void;
  calculatorKarat: 22 | 24;
  setCalculatorKarat: (value: 22 | 24) => void;
  calculatorWeight: string;
  setCalculatorWeight: (value: string) => void;
  calculatorCurrency: "EUR" | "TRY";
  setCalculatorCurrency: (value: "EUR" | "TRY") => void;
  calculatorFormatted: string | null;
  calculatorBuyFormatted: string | null;
  calculatorSellFormatted: string | null;
  calculatorSpreadFormatted: string | null;
}) {
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
            style={inputStyle}
            placeholder="z. B. 10"
          />
        </label>

        <label style={labelStyle}>
          Währung
          <select
            value={calculatorCurrency}
            onChange={(event) => setCalculatorCurrency(event.target.value as "EUR" | "TRY")}
            style={selectStyle}
          >
            <option value="EUR">Euro</option>
            <option value="TRY">Türkische Lira</option>
          </select>
        </label>
      </div>

      <div style={calculatorHintStyle}>
        Mit einer Produktvorlage werden Gewicht, Karat, Modus und Währung automatisch vorbelegt.
      </div>

      <div style={calculatorResultStyle}>
        {calculatorFormatted ? (
          <>
            <div>
              Geschätzter Wert: <strong>{calculatorFormatted}</strong>
            </div>
            <div>
              Modellierter Ankauf: <strong>{calculatorBuyFormatted}</strong>
            </div>
            <div>
              Modellierter Verkauf: <strong>{calculatorSellFormatted}</strong>
            </div>
            <div>
              Spread: <strong>{calculatorSpreadFormatted}</strong>
            </div>
          </>
        ) : (
          <>Bitte ein gültiges Gewicht eingeben.</>
        )}
      </div>
    </section>
  );
}