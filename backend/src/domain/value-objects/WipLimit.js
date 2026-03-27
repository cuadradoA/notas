class WipLimit {
  constructor(value) {
    if (value === null || value === undefined || value === "") {
      this.value = null;
      return;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error("WIP limit must be a positive integer");
    }

    this.value = parsed;
  }
}

module.exports = WipLimit;
