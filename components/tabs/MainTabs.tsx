import { activeTabStyle, tabButton, tabContainer } from "@/lib/gold/styles";
import type { LegalTab, TabMode } from "@/lib/gold/types";

export default function MainTabs({
  activeTab,
  setActiveTab,
  setLegalTab,
}: {
  activeTab: TabMode;
  setActiveTab: (value: TabMode) => void;
  setLegalTab: (value: LegalTab) => void;
}) {
  return (
    <div style={tabContainer}>
      <button
        onClick={() => {
          setActiveTab("ref");
          setLegalTab("none");
        }}
        style={{ ...tabButton, ...(activeTab === "ref" ? activeTabStyle : {}) }}
      >
        Referenzpreise
      </button>

      <button
        onClick={() => {
          setActiveTab("market");
          setLegalTab("none");
        }}
        style={{ ...tabButton, ...(activeTab === "market" ? activeTabStyle : {}) }}
      >
        Marktpreise
      </button>
    </div>
  );
}