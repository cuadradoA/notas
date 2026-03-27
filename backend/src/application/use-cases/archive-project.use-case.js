const ProjectService = require("../services/project.service");

class ArchiveProjectUseCase {
  async execute(projectId, user) {
    return ProjectService.archiveProject(projectId, user);
  }
}

module.exports = new ArchiveProjectUseCase();
