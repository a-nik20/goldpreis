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

export default function PriceTableSection({
  title,
  rows,
  favorites,
  toggleFavorite,
  isDual = false,
}: {
  title: string;
  rows: SingleRow[] | DualRow[];
  favorites: string[];
  toggleFavorite: (key: string) => void;
  isDual?: boolean;
}) {
  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>

      {rows.length === 0 ? (
        <EmptyState text="Keine passenden Produkte gefunden." />
      ) : isDual ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={favoriteThStyle}>★</th>
              <th style={thStyle}>Produkt</th>
              <th style={thStyle}>Tagesstart</th>
              <th style={thStyle}>Preis in Euro inkl. Live-Differenz</th>
              <th style={thStyle}>Preis in Türkischer Lira inkl. Live-Differenz</th>
              <th style={thStyle}>Änderung zum Vortag (EUR)</th>
              <th style={thStyle}>Ankauf (EUR)</th>
              <th style={thStyle}>Verkauf (EUR)</th>
              <th style={thStyle}>Spread (EUR)</th>
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
                <td style={tdStyle}>{row.name}</td>
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
              <th style={favoriteThStyle}>★</th>
              <th style={thStyle}>Produkt</th>
              <th style={thStyle}>Tagesstart</th>
              <th style={thStyle}>Preis inkl. Live-Differenz</th>
              <th style={thStyle}>Änderung zum Vortag (EUR)</th>
              <th style={thStyle}>Ankauf</th>
              <th style={thStyle}>Verkauf</th>
              <th style={thStyle}>Spread</th>
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
                <td style={tdStyle}>{row.name}</td>
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
    </section>
  );
}