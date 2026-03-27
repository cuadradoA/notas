const BoardService = require("../services/board.service");

class DeleteColumnUseCase {
  async execute(boardId, columnId, user) {
    return BoardService.deleteColumn(boardId, columnId, user);
  }
}

module.exports = new DeleteColumnUseCase();
