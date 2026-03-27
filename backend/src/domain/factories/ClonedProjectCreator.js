const ProjectCreator = require("./ProjectCreator");
const { PROJECT_STATUSES } = require("../value-objects/ProjectStatus");

class ClonedProjectCreator extends ProjectCreator {
  create(data, context) {
    const sourceProject = context.sourceProject;

    if (!sourceProject) {
      throw new Error("Source project is required for cloning");
    }

    const baseData = this.buildBaseProjectData({
      name: data.name || `${sourceProject.name} (Copia)`,
      description: data.description ?? sourceProject.description,
      startDate: data.startDate,
      estimatedEndDate: data.estimatedEndDate
    });

    return {
      ...baseData,
      status: PROJECT_STATUSES.PLANIFICADO,
      createdBy: context.userId,
      members: [context.userId],
      templateSourceProjectId: sourceProject._id,
      archivedAt: null
    };
  }
}

module.exports = ClonedProjectCreator;
