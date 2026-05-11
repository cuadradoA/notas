function normalizeName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

class ColumnSemanticFlyweightFactory {
  constructor() {
    this.cache = new Map();
  }

  get(column) {
    const normalizedName = normalizeName(column?.name);
    const cacheKey = normalizedName || "__empty__";

    if (!this.cache.has(cacheKey)) {
      const semantic = Object.freeze({
        normalizedName,
        isCompletedColumn: normalizedName.includes("complet") || normalizedName.includes("done"),
        isArchivedColumn: normalizedName.includes("archiv")
      });

      this.cache.set(cacheKey, semantic);
    }

    return this.cache.get(cacheKey);
  }
}

module.exports = new ColumnSemanticFlyweightFactory();
