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
    .replace(/1\/2/g, "halb")
    .replace(/1\/4/g, "viertel")
    .replace(/1\/10/g, "zehntel")
    .replace(/1\/25/g, "funfundzwanzigstel")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildSearchAliases(name: string) {
  const base = normalizeSearchText(name);
  const aliases = new Set<string>([base]);

  if (base.includes("ceyrek")) {
    aliases.add("ceyrek altin");
    aliases.add("c quarter altin");
  }
  if (base.includes("yarim")) {
    aliases.add("yarim altin");
  }
  if (base.includes("tam")) {
    aliases.add("tam altin");
  }
  if (base.includes("resat")) {
    aliases.add("resat");
    aliases.add("resat altin");
  }
  if (base.includes("gram altin")) {
    aliases.add("gram altin");
    aliases.add("altin gram");
  }
  if (base.includes("gold armreif")) {
    aliases.add("armreif");
    aliases.add("armband gold");
    aliases.add("22 ayar");
  }
  if (base.includes("wiener philharmoniker")) {
    aliases.add("philharmoniker");
    aliases.add("wiener");
    aliases.add("1 oz");
    aliases.add("unze");
  }
  if (base.includes("goldbarren")) {
    aliases.add("barren");
    aliases.add("gold bar");
    aliases.add("bar");
  }

  return Array.from(aliases);
}