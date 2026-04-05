import {
  favoriteButtonActiveStyle,
  favoriteButtonStyle,
} from "@/lib/gold/styles";

export default function FavoriteButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...favoriteButtonStyle,
        ...(active ? favoriteButtonActiveStyle : {}),
      }}
      aria-label={active ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      title={active ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}