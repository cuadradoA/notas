const ProjectCreator = require("./ProjectCreator");
const { PROJECT_STATUSES } = require("../value-objects/ProjectStatus");

class NewProjectCreator extends ProjectCreator {
  create(data, context) {
    const baseData = this.buildBaseProjectData(data);

    return {
      ...baseData,
      status: data.status || PROJECT_STATUSES.PLANIFICADO,
      createdBy: context.userId,
      members: [context.userId],
      templateSourceProjectId: null,
      archivedAt: null
    };
  }
}

module.exports = NewProjectCreator;
