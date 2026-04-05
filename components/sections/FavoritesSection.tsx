import FavoriteButton from "@/components/ui/FavoriteButton";
import {
  cardStyle,
  favoriteCardBodyStyle,
  favoriteCardHeaderStyle,
  favoriteCardStyle,
  favoriteGridStyle,
  sectionTitleStyle,
} from "@/lib/gold/styles";
import type { DualRow, SingleRow } from "@/lib/gold/types";

function FavoriteStripCard({
  row,
  favorites,
  toggleFavorite,
}: {
  row: SingleRow | DualRow;
  favorites: string[];
  toggleFavorite: (key: string) => void;
}) {
  const isDual = "priceEur" in row;

  return (
    <div style={favoriteCardStyle}>
      <div style={favoriteCardHeaderStyle}>
        <strong>{row.name}</strong>
        <FavoriteButton
          active={favorites.includes(row.favoriteKey)}
          onClick={() => toggleFavorite(row.favoriteKey)}
        />
      </div>

      <div style={favoriteCardBodyStyle}>
        {isDual ? (
          <>
            <div>Preis EUR: {row.priceEur}</div>
            <div>Preis TRY: {row.priceTry}</div>
            <div>Spread: {row.spreadTextEur}</div>
          </>
        ) : (
          <>
            <div>Preis: {row.price}</div>
            <div>Spread: {row.spreadText}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FavoritesSection({
  favoriteRows,
  favorites,
  toggleFavorite,
}: {
  favoriteRows: Array<SingleRow | DualRow>;
  favorites: string[];
  toggleFavorite: (key: string) => void;
}) {
  if (favoriteRows.length === 0) return null;

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>⭐ Deine Favoriten</h2>
      <div style={favoriteGridStyle}>
        {favoriteRows.map((row) => (
          <FavoriteStripCard
            key={row.favoriteKey}
            row={row}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}