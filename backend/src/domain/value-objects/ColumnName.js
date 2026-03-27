class ColumnName {
  constructor(value) {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error("Column name is required");
    }

    if (normalized.length > 60) {
      throw new Error("Column name is too long");
    }

    this.value = normalized;
  }
}

module.exports = ColumnName;
