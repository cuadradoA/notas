const BoardService = require("../services/board.service");

class SetWipLimitUseCase {
  async execute(boardId, columnId, wipLimit, user) {
    return BoardService.setWipLimit(boardId, columnId, wipLimit, user);
  }
}

module.exports = new SetWipLimitUseCase();
