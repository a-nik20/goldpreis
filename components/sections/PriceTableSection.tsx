import DayDiffCell from "@/components/ui/DayDiffCell";
import EmptyState from "@/components/ui/EmptyState";
import FavoriteButton from "@/components/ui/FavoriteButton";
import InlinePrice from "@/components/ui/InlinePrice";
import {
  cardStyle,
  favoriteTdStyle,
  favoriteThStyle,
  sectionTitleStyle,
  tableStyle,
  tdStyle,
  thStyle,
} from "@/lib/gold/styles";
import type { DualRow, SingleRow } from "@/lib/gold/types";

function labelValueRow(label: string, content: React.ReactNode) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: "10px",
        alignItems: "start",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          color: "#6b7280",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontSize: "14px",
          color: "#111827",
          fontWeight: 600,
          minWidth: 0,
        }}
      >
        {content}
      </div>
    </div>
  );
}

function MobileSingleCard({
  row,
  favorites,
  toggleFavorite,
}: {
  row: SingleRow;
  favorites: string[];
  toggleFavorite: (key: string) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "14px",
        backgroundColor: "#ffffff",
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
        display: "grid",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              color: "#111827",
              fontSize: "16px",
              lineHeight: 1.4,
            }}
          >
            {row.name}
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "18px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            <InlinePrice
              value={row.price}
              diffText={row.liveDiffText}
              diffValue={row.liveDiffValue}
            />
          </div>
        </div>

        <FavoriteButton
          active={favorites.includes(row.favoriteKey)}
          onClick={() => toggleFavorite(row.favoriteKey)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
          paddingTop: "4px",
          borderTop: "1px solid #f0f2f5",
        }}
      >
        {labelValueRow("Tagesstart", row.dayStartText)}
        {labelValueRow("Änderung", <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />)}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "10px 12px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>Ankauf</div>
          <div style={{ marginTop: "4px", fontWeight: 800, color: "#111827" }}>{row.buyPrice}</div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "10px 12px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>Verkauf</div>
          <div style={{ marginTop: "4px", fontWeight: 800, color: "#111827" }}>{row.sellPrice}</div>
        </div>
      </div>

      <div
        style={{
          borderRadius: "14px",
          padding: "10px 12px",
          backgroundColor: "#fff8e7",
          border: "1px solid #f4d58d",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#5b4a1f" }}>Differenz</span>
        <span style={{ fontWeight: 800, color: "#5b4a1f" }}>{row.spreadText}</span>
      </div>
    </div>
  );
}

function MobileDualCard({
  row,
  favorites,
  toggleFavorite,
}: {
  row: DualRow;
  favorites: string[];
  toggleFavorite: (key: string) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "14px",
        backgroundColor: "#ffffff",
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
        display: "grid",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              color: "#111827",
              fontSize: "16px",
              lineHeight: 1.4,
            }}
          >
            {row.name}
          </div>

          <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              <InlinePrice
                value={row.priceEur}
                diffText={row.liveDiffTextEur}
                diffValue={row.liveDiffValueEur}
              />
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#374151",
              }}
            >
              <InlinePrice
                value={row.priceTry}
                diffText={row.liveDiffTextTry}
                diffValue={row.liveDiffValueTry}
              />
            </div>
          </div>
        </div>

        <FavoriteButton
          active={favorites.includes(row.favoriteKey)}
          onClick={() => toggleFavorite(row.favoriteKey)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
          paddingTop: "4px",
          borderTop: "1px solid #f0f2f5",
        }}
      >
        {labelValueRow("Tagesstart", row.dayStartText)}
        {labelValueRow("Änderung", <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />)}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "10px 12px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>Ankauf (EUR)</div>
          <div style={{ marginTop: "4px", fontWeight: 800, color: "#111827" }}>
            {row.buyPriceEur}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "10px 12px",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>Verkauf (EUR)</div>
          <div style={{ marginTop: "4px", fontWeight: 800, color: "#111827" }}>
            {row.sellPriceEur}
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: "14px",
          padding: "10px 12px",
          backgroundColor: "#fff8e7",
          border: "1px solid #f4d58d",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#5b4a1f" }}>Differenz (EUR)</span>
        <span style={{ fontWeight: 800, color: "#5b4a1f" }}>{row.spreadTextEur}</span>
      </div>
    </div>
  );
}

export default function PriceTableSection({
  title,
  rows,
  favorites,
  toggleFavorite,
  isDual = false,
  viewMode = "desktop",
  sectionId,
}: {
  title: string;
  rows: SingleRow[] | DualRow[];
  favorites: string[];
  toggleFavorite: (key: string) => void;
  isDual?: boolean;
  viewMode?: "desktop" | "mobile";
  sectionId?: string;
}) {
  return (
    <section id={sectionId} style={cardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>

      {rows.length === 0 ? (
        <EmptyState text="Keine passenden Produkte gefunden." />
      ) : viewMode === "mobile" ? (
        <div style={{ display: "grid", gap: "12px" }}>
          {isDual
            ? (rows as DualRow[]).map((row) => (
                <MobileDualCard
                  key={row.id}
                  row={row}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              ))
            : (rows as SingleRow[]).map((row) => (
                <MobileSingleCard
                  key={row.id}
                  row={row}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              ))}
        </div>
      ) : (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
          }}
        >
          {isDual ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...favoriteThStyle,
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                    }}
                  >
                    ★
                  </th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Produkt</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Tagesstart</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>
                    Preis in Euro inkl. Live-Differenz
                  </th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>
                    Preis in Türkischer Lira inkl. Live-Differenz
                  </th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>
                    Änderung zum Vortag (EUR)
                  </th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Ankauf (EUR)</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Verkauf (EUR)</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Differenz (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {(rows as DualRow[]).map((row) => (
                  <tr key={row.id}>
                    <td style={favoriteTdStyle}>
                      <FavoriteButton
                        active={favorites.includes(row.favoriteKey)}
                        onClick={() => toggleFavorite(row.favoriteKey)}
                      />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{row.name}</td>
                    <td style={tdStyle}>{row.dayStartText}</td>
                    <td style={tdStyle}>
                      <InlinePrice
                        value={row.priceEur}
                        diffText={row.liveDiffTextEur}
                        diffValue={row.liveDiffValueEur}
                      />
                    </td>
                    <td style={tdStyle}>
                      <InlinePrice
                        value={row.priceTry}
                        diffText={row.liveDiffTextTry}
                        diffValue={row.liveDiffValueTry}
                      />
                    </td>
                    <td style={tdStyle}>
                      <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                    </td>
                    <td style={tdStyle}>{row.buyPriceEur}</td>
                    <td style={tdStyle}>{row.sellPriceEur}</td>
                    <td style={tdStyle}>{row.spreadTextEur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...favoriteThStyle,
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                    }}
                  >
                    ★
                  </th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Produkt</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Tagesstart</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>
                    Preis inkl. Live-Differenz
                  </th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>
                    Änderung zum Vortag (EUR)
                  </th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Ankauf</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Verkauf</th>
                  <th style={{ ...thStyle, position: "sticky", top: 0, zIndex: 2 }}>Differenz</th>
                </tr>
              </thead>
              <tbody>
                {(rows as SingleRow[]).map((row) => (
                  <tr key={row.id}>
                    <td style={favoriteTdStyle}>
                      <FavoriteButton
                        active={favorites.includes(row.favoriteKey)}
                        onClick={() => toggleFavorite(row.favoriteKey)}
                      />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{row.name}</td>
                    <td style={tdStyle}>{row.dayStartText}</td>
                    <td style={tdStyle}>
                      <InlinePrice
                        value={row.price}
                        diffText={row.liveDiffText}
                        diffValue={row.liveDiffValue}
                      />
                    </td>
                    <td style={tdStyle}>
                      <DayDiffCell text={row.dayDiffText} value={row.dayDiffValue} />
                    </td>
                    <td style={tdStyle}>{row.buyPrice}</td>
                    <td style={tdStyle}>{row.sellPrice}</td>
                    <td style={tdStyle}>{row.spreadText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}