const DateRange = require("../value-objects/DateRange");

class ProjectCreator {
  create() {
    throw new Error("create() must be implemented");
  }

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
}

module.exports = ProjectCreator;
