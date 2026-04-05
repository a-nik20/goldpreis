import {
  inputStyle,
  labelStyle,
  selectStyle,
  suggestionBoxStyle,
  suggestionItemStyle,
  toolbarGroupStyle,
  toolbarStyle,
  utilityButtonActiveStyle,
  utilityButtonStyle,
} from "@/lib/gold/styles";
import type { SortKey } from "@/lib/gold/types";
import type React from "react";

export default function SearchToolbar({
  searchBoxRef,
  query,
  setQuery,
  setShowSuggestions,
  showSuggestions,
  suggestions,
  sortKey,
  setSortKey,
  onlyFavorites,
  setOnlyFavorites,
  onRefresh,
  favoritesFirst,
  setFavoritesFirst,
}: {
  searchBoxRef: React.RefObject<HTMLDivElement | null>;
  query: string;
  setQuery: (value: string) => void;
  setShowSuggestions: (value: boolean) => void;
  showSuggestions: boolean;
  suggestions: string[];
  sortKey: SortKey;
  setSortKey: (value: SortKey) => void;
  onlyFavorites: boolean;
  setOnlyFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh: () => void;
  favoritesFirst: boolean;
  setFavoritesFirst: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div style={toolbarStyle}>
      <div style={toolbarGroupStyle} ref={searchBoxRef}>
        <label style={labelStyle}>
          Produktsuche
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="z. B. ceyrek altin, barren, philharmoniker"
            style={inputStyle}
          />
        </label>

        {showSuggestions && suggestions.length > 0 && (
          <div style={suggestionBoxStyle}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                style={suggestionItemStyle}
                onClick={() => {
                  setQuery(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={toolbarGroupStyle}>
        <label style={labelStyle}>
          Sortierung
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            style={selectStyle}
          >
            <option value="default">Standard</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-asc">Preis aufsteigend</option>
            <option value="price-desc">Preis absteigend</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => setOnlyFavorites((prev) => !prev)}
          style={{
            ...utilityButtonStyle,
            ...(onlyFavorites ? utilityButtonActiveStyle : {}),
          }}
        >
          {onlyFavorites ? "Nur Favoriten: AN" : "Nur Favoriten"}
        </button>

        <button
          type="button"
          onClick={() => setFavoritesFirst((prev) => !prev)}
          style={{
            ...utilityButtonStyle,
            ...(favoritesFirst ? utilityButtonActiveStyle : {}),
          }}
        >
          {favoritesFirst ? "Favoriten zuerst: AN" : "Favoriten zuerst"}
        </button>

        <button type="button" onClick={onRefresh} style={utilityButtonStyle}>
          Jetzt aktualisieren
        </button>
      </div>
    </div>
  );
}