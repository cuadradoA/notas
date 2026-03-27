const BoardService = require("../services/board.service");

class AddBoardToProjectUseCase {
  async execute(projectId, data, user) {
    return BoardService.addBoardToProject(projectId, data, user);
  }
}

module.exports = new AddBoardToProjectUseCase();
