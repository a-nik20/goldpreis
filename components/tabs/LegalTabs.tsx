import {
  activeBottomLegalButtonStyle,
  bottomLegalButtonStyle,
  bottomLegalNavStyle,
} from "@/lib/gold/styles";
import type { LegalTab } from "@/lib/gold/types";

export default function LegalTabs({
  legalTab,
  setLegalTab,
}: {
  legalTab: LegalTab;
  setLegalTab: React.Dispatch<React.SetStateAction<LegalTab>>;
}) {
  return (
    <div style={bottomLegalNavStyle}>
      <button
        onClick={() => setLegalTab((prev) => (prev === "impressum" ? "none" : "impressum"))}
        style={{
          ...bottomLegalButtonStyle,
          ...(legalTab === "impressum" ? activeBottomLegalButtonStyle : {}),
        }}
      >
        Impressum
      </button>

      <button
        onClick={() => setLegalTab((prev) => (prev === "disclaimer" ? "none" : "disclaimer"))}
        style={{
          ...bottomLegalButtonStyle,
          ...(legalTab === "disclaimer" ? activeBottomLegalButtonStyle : {}),
        }}
      >
        Disclaimer & Datenschutz
      </button>

      <button
        onClick={() => setLegalTab((prev) => (prev === "calculation" ? "none" : "calculation"))}
        style={{
          ...bottomLegalButtonStyle,
          ...(legalTab === "calculation" ? activeBottomLegalButtonStyle : {}),
        }}
      >
        Wie werden Marktpreise berechnet?
      </button>
    </div>
  );
}