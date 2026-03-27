const BoardService = require("../../application/services/board.service");
const AddBoardToProjectUseCase = require("../../application/use-cases/add-board-to-project.use-case");
const CreateColumnUseCase = require("../../application/use-cases/create-column.use-case");
const UpdateColumnUseCase = require("../../application/use-cases/update-column.use-case");
const DeleteColumnUseCase = require("../../application/use-cases/delete-column.use-case");
const SetWipLimitUseCase = require("../../application/use-cases/set-wip-limit.use-case");

exports.listByProject = async (req, res) => {
  try {
    const boards = await BoardService.listBoardsByProject(req.params.projectId, req.user);
    res.json(boards);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const board = await BoardService.getBoardById(req.params.boardId, req.user);
    res.json(board);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.createBoard = async (req, res) => {
  try {
    const board = await AddBoardToProjectUseCase.execute(req.params.projectId, req.body, req.user);
    res.json(board);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.createColumn = async (req, res) => {
  try {
    const board = await CreateColumnUseCase.execute(req.params.boardId, req.body, req.user);
    res.json(board);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateColumn = async (req, res) => {
  try {
    const board = await UpdateColumnUseCase.execute(
      req.params.boardId,
      req.params.columnId,
      req.body,
      req.user
    );
    res.json(board);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.deleteColumn = async (req, res) => {
  try {
    const board = await DeleteColumnUseCase.execute(
      req.params.boardId,
      req.params.columnId,
      req.user
    );
    res.json(board);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.setWipLimit = async (req, res) => {
  try {
    const board = await SetWipLimitUseCase.execute(
      req.params.boardId,
      req.params.columnId,
      req.body.wipLimit,
      req.user
    );
    res.json(board);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
