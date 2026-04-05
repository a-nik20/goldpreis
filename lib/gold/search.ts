export function normalizeSearchText(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/ä/g, "a")
    .replace(/ß/g, "ss")
    .replace(/1\/2/g, "halb")
    .replace(/1\/4/g, "viertel")
    .replace(/1\/10/g, "zehntel")
    .replace(/1\/25/g, "funfundzwanzigstel")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeSearchText(text)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from<number>({ length: b.length + 1 }).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function isFuzzyTokenMatch(queryToken: string, candidateToken: string) {
  if (!queryToken || !candidateToken) return false;
  if (candidateToken.includes(queryToken)) return true;
  if (queryToken.length <= 2) return candidateToken.startsWith(queryToken);
  if (queryToken.length <= 4) return levenshtein(queryToken, candidateToken) <= 1;
  return levenshtein(queryToken, candidateToken) <= 2;
}

export function buildSearchAliases(name: string) {
  const base = normalizeSearchText(name);
  const aliases = new Set<string>([base]);

  if (base.includes("ceyrek")) {
    aliases.add("ceyrek altin");
    aliases.add("ceyrek altini");
    aliases.add("c quarter altin");
    aliases.add("viertel altin");
    aliases.add("viertel gold");
  }

  if (base.includes("yarim")) {
    aliases.add("yarim altin");
    aliases.add("halbes altin");
    aliases.add("halbes gold");
  }

  if (base.includes("tam")) {
    aliases.add("tam altin");
    aliases.add("ganzes altin");
    aliases.add("ganzes gold");
  }

  if (base.includes("resat")) {
    aliases.add("resat");
    aliases.add("resat altin");
    aliases.add("resat altini");
    aliases.add("resad");
  }

  if (base.includes("gremse")) {
    aliases.add("gremse");
    aliases.add("gremse altin");
  }

  if (base.includes("gram altin")) {
    aliases.add("gram altin");
    aliases.add("altin gram");
    aliases.add("gramm gold");
    aliases.add("1 g altin");
  }

  if (base.includes("gold armreif")) {
    aliases.add("armreif");
    aliases.add("armband gold");
    aliases.add("22 ayar");
    aliases.add("bilezik");
    aliases.add("gold bilezik");
  }

  if (base.includes("wiener philharmoniker")) {
    aliases.add("philharmoniker");
    aliases.add("wiener");
    aliases.add("1 oz");
    aliases.add("unze");
    aliases.add("philharmoniker gold");
  }

  if (base.includes("goldbarren")) {
    aliases.add("barren");
    aliases.add("gold bar");
    aliases.add("bar");
    aliases.add("bullion");
  }

  if (base.includes("dukat")) {
    aliases.add("dukat");
    aliases.add("dukaten");
    aliases.add("franz joseph dukat");
  }

  if (base.includes("kronen")) {
    aliases.add("kronen");
    aliases.add("krone gold");
    aliases.add("gold kronen");
  }

  if (base.includes("gulden")) {
    aliases.add("gulden");
    aliases.add("gold gulden");
  }

  if (base.includes("spotpreis")) {
    aliases.add("spot");
    aliases.add("spot gold");
    aliases.add("referenz");
  }

  return Array.from(aliases);
}

export function matchesSmartSearch(name: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const aliases = buildSearchAliases(name);

  if (aliases.some((alias) => alias.includes(normalizedQuery))) {
    return true;
  }

  const queryTokens = tokenize(normalizedQuery);

  return aliases.some((alias) => {
    const aliasTokens = tokenize(alias);

    return queryTokens.every((queryToken) =>
      aliasTokens.some((aliasToken) => isFuzzyTokenMatch(queryToken, aliasToken))
    );
  });
}

function scoreSuggestion(name: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const aliases = buildSearchAliases(name);
  let best = 0;

  for (const alias of aliases) {
    if (alias === normalizedQuery) best = Math.max(best, 200);
    else if (alias.startsWith(normalizedQuery)) best = Math.max(best, 150);
    else if (alias.includes(normalizedQuery)) best = Math.max(best, 120);
    else {
      const queryTokens = tokenize(normalizedQuery);
      const aliasTokens = tokenize(alias);

      let tokenScore = 0;
      const allMatched = queryTokens.every((queryToken) => {
        const exact = aliasTokens.find((aliasToken) => aliasToken === queryToken);
        if (exact) {
          tokenScore += 20;
          return true;
        }

        const partial = aliasTokens.find((aliasToken) => aliasToken.includes(queryToken));
        if (partial) {
          tokenScore += 12;
          return true;
        }

        const fuzzy = aliasTokens.find((aliasToken) => isFuzzyTokenMatch(queryToken, aliasToken));
        if (fuzzy) {
          tokenScore += 8;
          return true;
        }

        return false;
      });

      if (allMatched) {
        best = Math.max(best, tokenScore);
      }
    }
  }

  return best;
}

export function getRankedSuggestions(names: string[], query: string, limit = 8) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return names
    .map((name) => ({
      name,
      score: scoreSuggestion(name, normalizedQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name, "de");
    })
    .slice(0, limit)
    .map((item) => item.name);
}