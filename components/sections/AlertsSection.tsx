import EmptyState from "@/components/ui/EmptyState";
import {
  alertCardStyle,
  alertListStyle,
  alertSubTextStyle,
  calculatorGridStyle,
  cardStyle,
  inputStyle,
  labelStyle,
  removeAlertButtonStyle,
  sectionTitleStyle,
  selectStyle,
  utilityButtonStyle,
} from "@/lib/gold/styles";
import type { AlertItem, DualRow, SingleRow } from "@/lib/gold/types";

export default function AlertsSection({
  allRows,
  alertProduct,
  setAlertProduct,
  alertDirection,
  setAlertDirection,
  alertTarget,
  setAlertTarget,
  createAlert,
  alerts,
  removeAlert,
}: {
  allRows: Array<SingleRow | DualRow>;
  alertProduct: string;
  setAlertProduct: (value: string) => void;
  alertDirection: "below" | "above";
  setAlertDirection: (value: "below" | "above") => void;
  alertTarget: string;
  setAlertTarget: (value: string) => void;
  createAlert: () => void;
  alerts: AlertItem[];
  removeAlert: (id: string) => void;
}) {
  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Preis-Alarm</h2>

      <div style={calculatorGridStyle}>
        <label style={labelStyle}>
          Produkt
          <select
            value={alertProduct}
            onChange={(event) => setAlertProduct(event.target.value)}
            style={selectStyle}
          >
            <option value="">Bitte wählen</option>
            {allRows.map((row) => (
              <option key={row.favoriteKey} value={row.name}>
                {row.name}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Richtung
          <select
            value={alertDirection}
            onChange={(event) => setAlertDirection(event.target.value as "below" | "above")}
            style={selectStyle}
          >
            <option value="below">unter Preis</option>
            <option value="above">über Preis</option>
          </select>
        </label>

        <label style={labelStyle}>
          Zielpreis in EUR
          <input
            value={alertTarget}
            onChange={(event) => setAlertTarget(event.target.value)}
            style={inputStyle}
            placeholder="z. B. 100"
          />
        </label>

        <div style={labelStyle}>
          <span>Aktion</span>
          <button type="button" onClick={createAlert} style={utilityButtonStyle}>
            Alarm speichern
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState text="Noch keine Preis-Alarme gespeichert." />
      ) : (
        <div style={alertListStyle}>
          {alerts.map((alert) => (
            <div key={alert.id} style={alertCardStyle}>
              <div>
                <strong>{alert.productName}</strong>
                <div style={alertSubTextStyle}>
                  {alert.direction === "below" ? "Alarm bei unter" : "Alarm bei über"}{" "}
                  {alert.targetPrice.toFixed(2)} €
                </div>
                <div style={alertSubTextStyle}>
                  Status: {alert.active ? "aktiv" : "ausgelöst"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
                style={removeAlertButtonStyle}
              >
                Entfernen
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}