import FavoriteButton from "@/components/ui/FavoriteButton";
import { tableStyle, thStyle, tdStyle, sectionTitleStyle, cardStyle } from "@/lib/gold/styles";
import type { SingleRow } from "@/lib/gold/types";

export default function PricesTable({
  title,
  rows,
  favorites,
  toggleFavorite,
}: {
  title: string;
  rows: SingleRow[];
  favorites: string[];
  toggleFavorite: (key: string) => void;
}) {
  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>★</th>
            <th style={thStyle}>Produkt</th>
            <th style={thStyle}>Preis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>
                <FavoriteButton
                  active={favorites.includes(row.favoriteKey)}
                  onClick={() => toggleFavorite(row.favoriteKey)}
                />
              </td>
              <td style={tdStyle}>{row.name}</td>
              <td style={tdStyle}>{row.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}