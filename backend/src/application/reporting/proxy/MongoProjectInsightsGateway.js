const Board = require("../../../domain/entities/Board");
const Task = require("../../../domain/entities/Task");

class MongoProjectInsightsGateway {
  async getBoards(projectId) {
    return Board.find({ projectId }).sort({ createdAt: 1 });
  }

  async getTasks(projectId, boards = null) {
    const resolvedBoards = boards || await this.getBoards(projectId);
    const boardIds = resolvedBoards.map((board) => board._id);

    if (!boardIds.length) {
      return [];
    }

    return Task.find({ boardId: { $in: boardIds } }).populate("assignees", "username email");
  }
}

module.exports = MongoProjectInsightsGateway;
