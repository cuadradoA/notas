const DateRange = require("../value-objects/DateRange");

class ProjectFactory {
  buildBaseProjectData(data) {
    const name = data.name?.trim();

    if (!name) {
      throw new Error("Project name is required");
    }

    const dateRange = new DateRange(data.startDate, data.estimatedEndDate);

    return {
      name,
      description: data.description?.trim() || "",
      ...dateRange.toObject()
    };
  }

  create() {
    throw new Error("create() must be implemented");
  }
}

module.exports = ProjectFactory;
