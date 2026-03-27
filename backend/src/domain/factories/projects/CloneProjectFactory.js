const ProjectFactory = require("./ProjectFactory");
const { PROJECT_STATUSES } = require("../../value-objects/ProjectStatus");

class CloneProjectFactory extends ProjectFactory {
  create(data, context) {
    const sourceProject = context.sourceProject;

    if (!sourceProject) {
      throw new Error("Source project is required");
    }

    const clonedBase = sourceProject.clone({
      name: data.name || `${sourceProject.name} (Copia)`,
      description: data.description ?? sourceProject.description,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      estimatedEndDate: data.estimatedEndDate
        ? new Date(data.estimatedEndDate)
        : sourceProject.estimatedEndDate
    });
    const baseData = this.buildBaseProjectData(clonedBase);

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

module.exports = CloneProjectFactory;
