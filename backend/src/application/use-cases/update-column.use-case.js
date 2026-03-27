const BoardService = require("../services/board.service");

class UpdateColumnUseCase {
  async execute(boardId, columnId, data, user) {
    return BoardService.updateColumn(boardId, columnId, data, user);
  }
}

module.exports = new UpdateColumnUseCase();
