class DateRange {
  constructor(startDate, estimatedEndDate) {
    this.startDate = startDate ? new Date(startDate) : null;
    this.estimatedEndDate = estimatedEndDate ? new Date(estimatedEndDate) : null;

    if (!this.startDate || Number.isNaN(this.startDate.getTime())) {
      throw new Error("startDate is required");
    }

    if (!this.estimatedEndDate || Number.isNaN(this.estimatedEndDate.getTime())) {
      throw new Error("estimatedEndDate is required");
    }

    if (this.estimatedEndDate < this.startDate) {
      throw new Error("estimatedEndDate must be after startDate");
    }
  }

  toObject() {
    return {
      startDate: this.startDate,
      estimatedEndDate: this.estimatedEndDate
    };
  }
}

module.exports = DateRange;
