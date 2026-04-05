import {
  topInfoTextStyle,
  trustInfoCardStyle,
  trustInfoSectionStyle,
} from "@/lib/gold/styles";

export default function TrustInfoSection() {
  return (
    <section style={trustInfoSectionStyle}>
      <div style={trustInfoCardStyle}>
        <strong>Transparenz</strong>
        <p style={topInfoTextStyle}>
          Tagesstart, Ankauf, Verkauf und Spread werden sichtbar ausgewiesen, damit
          Preisbewegungen nachvollziehbarer bleiben.
        </p>
      </div>

      <div style={trustInfoCardStyle}>
        <strong>Historische Daten</strong>
        <p style={topInfoTextStyle}>
          Die Verlaufskarten basieren auf serverseitig gespeicherten Daten und nicht nur auf
          temporären Browserwerten.
        </p>
      </div>

      <div style={trustInfoCardStyle}>
        <strong>Suchlogik</strong>
        <p style={topInfoTextStyle}>
          Auch vereinfachte Schreibweisen wie ceyrek altin, armreif oder philharmoniker werden
          erkannt.
        </p>
      </div>
    </section>
  );
}