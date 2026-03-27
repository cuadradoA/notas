const ProjectService = require("../services/project.service");

class CreateProjectUseCase {
  async execute(data, userId) {
    return ProjectService.createProject(data, userId);
  }
}

module.exports = new CreateProjectUseCase();
