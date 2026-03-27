const BoardService = require("../services/board.service");

class CreateColumnUseCase {
  async execute(boardId, data, user) {
    return BoardService.createColumn(boardId, data, user);
  }
}

module.exports = new CreateColumnUseCase();
