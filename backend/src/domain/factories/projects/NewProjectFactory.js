const ProjectFactory = require("./ProjectFactory");
const { PROJECT_STATUSES } = require("../../value-objects/ProjectStatus");

class NewProjectFactory extends ProjectFactory {
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

module.exports = NewProjectFactory;
