const ProjectService = require("../services/project.service");

class CloneProjectUseCase {
  async execute(projectId, data, user) {
    return ProjectService.cloneProject(projectId, data, user);
  }
}

module.exports = new CloneProjectUseCase();
