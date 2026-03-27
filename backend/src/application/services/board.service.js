const mongoose = require("mongoose");
const Board = require("../../domain/entities/Board");
const Task = require("../../domain/entities/Task");
const Project = require("../../domain/entities/Project");
const BoardFactoryResolver = require("../../domain/factories/boards/BoardFactoryResolver");
const ColumnFactoryResolver = require("../../domain/factories/columns/ColumnFactoryResolver");
const ColumnName = require("../../domain/value-objects/ColumnName");
const WipLimit = require("../../domain/value-objects/WipLimit");
const { ProjectStatus } = require("../../domain/value-objects/ProjectStatus");
const { serializeTask } = require("../serializers/task.serializer");

function ensureValidObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${label}`);
  }
}

async function getProjectOrThrow(projectId) {
  ensureValidObjectId(projectId, "project id");

  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

function isCreatorOrAdmin(project, user) {
  return project.createdBy.toString() === user.id || user.role === "ADMIN";
}

function isMember(project, userId) {
  return project.members.some((memberId) => memberId.toString() === userId);
}

function ensureCanAccessProject(project, user) {
  if (!isCreatorOrAdmin(project, user) && !isMember(project, user.id)) {
    throw new Error("No permission to access this project");
  }
}

function ensureCanManageProject(project, user) {
  if (!isCreatorOrAdmin(project, user)) {
    throw new Error("No permission to manage this project");
  }
}

function ensureProjectWritable(project) {
  if (ProjectStatus.isReadOnly(project.status)) {
    throw new Error("Archived projects are read-only");
  }
}

function sortColumns(columns) {
  return [...columns].sort((a, b) => a.order - b.order);
}

function normalizeColumnOrders(columns) {
  return sortColumns(columns).map((column, index) => ({
    ...column.toObject?.() || column,
    order: index + 1
  }));
}

function reorderColumns(columns, columnId, targetOrder) {
  const normalized = normalizeColumnOrders(columns);
  const currentIndex = normalized.findIndex((column) => column._id.toString() === columnId.toString());

  if (currentIndex === -1) {
    throw new Error("Column not found");
  }

  const [movedColumn] = normalized.splice(currentIndex, 1);
  normalized.splice(targetOrder - 1, 0, movedColumn);

  return normalized.map((column, index) => ({
    ...column,
    order: index + 1
  }));
}

function getColumnOrThrow(board, columnId) {
  const column = board.columns.id(columnId);

  if (!column) {
    throw new Error("Column not found");
  }

  return column;
}

async function getTaskCountByColumn(boardId, columnId) {
  const board = await Board.findById(boardId).select("columns");
  const column = board?.columns?.id(columnId);
  const variants = [columnId.toString()];

  if (column?.name) {
    variants.push(column.name);
  }

  return Task.countDocuments({
    boardId,
    archivedAt: null,
    columnId: { $in: variants }
  });
}

async function enrichBoard(board) {
  const tasks = await Task.find({ boardId: board._id, archivedAt: null })
    .populate("createdBy", "username email role")
    .populate("assignees", "username email role")
    .select("title description type priority labels createdBy assignees dueDate estimatedHours spentHours columnId completedAt subtasks comments attachments.name attachments.size createdAt updatedAt");

  const columns = await Promise.all(
    sortColumns(board.columns).map(async (column) => ({
      _id: column._id,
      name: column.name,
      order: column.order,
      wipLimit: column.wipLimit,
      taskCount: await getTaskCountByColumn(board._id, column._id),
      tasks: tasks.filter(
        (task) =>
          task.columnId === column._id.toString() ||
          task.columnId === column.name
      ).map((task) => serializeTask(task))
    }))
  );

  const archivedTasks = await Task.find({ boardId: board._id, archivedAt: { $ne: null } })
    .populate("createdBy", "username email role avatar description")
    .populate("assignees", "username email role avatar description")
    .sort({ archivedAt: -1, updatedAt: -1 });

  return {
    _id: board._id,
    projectId: board.projectId,
    name: board.name,
    columns,
    archivedTasks: archivedTasks.map((task) => serializeTask(task))
  };
}

exports.createDefaultBoard = async (projectId) => {
  const boardFactory = BoardFactoryResolver.create("default");
  return Board.create(boardFactory.create(projectId));
};

exports.listBoardsByProject = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccessProject(project, user);

  const boards = await Board.find({ projectId }).sort({ createdAt: 1 });
  return Promise.all(boards.map(enrichBoard));
};

exports.addBoardToProject = async (projectId, data, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanManageProject(project, user);
  ensureProjectWritable(project);

  const boardFactory = BoardFactoryResolver.create("custom");
  const board = await Board.create(boardFactory.create(projectId, data));

  if (!board.columns.length) {
    const defaultColumns = ColumnFactoryResolver.create("default").create();
    board.columns = defaultColumns;
    await board.save();
  }

  return enrichBoard(board);
};

exports.createColumn = async (boardId, data, user) => {
  ensureValidObjectId(boardId, "board id");
  const board = await Board.findById(boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const project = await getProjectOrThrow(board.projectId);
  ensureCanManageProject(project, user);
  ensureProjectWritable(project);

  const customColumnFactory = ColumnFactoryResolver.create("custom");
  const column = customColumnFactory.create(data, { order: board.columns.length + 1 });

  board.columns.push(column);
  board.columns = normalizeColumnOrders(board.columns);
  await board.save();

  return enrichBoard(board);
};

exports.updateColumn = async (boardId, columnId, data, user) => {
  ensureValidObjectId(boardId, "board id");
  const board = await Board.findById(boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const project = await getProjectOrThrow(board.projectId);
  ensureCanManageProject(project, user);
  ensureProjectWritable(project);

  getColumnOrThrow(board, columnId);

  let nextColumns = normalizeColumnOrders(board.columns);
  const targetColumn = nextColumns.find((column) => column._id.toString() === columnId.toString());

  if (data.name !== undefined) {
    targetColumn.name = new ColumnName(data.name).value;
  }

  if (data.wipLimit !== undefined) {
    targetColumn.wipLimit = new WipLimit(data.wipLimit).value;
  }

  if (data.order !== undefined) {
    const targetOrder = Math.max(1, Math.min(Number(data.order), nextColumns.length));
    nextColumns = reorderColumns(nextColumns, columnId, targetOrder);
  } else {
    nextColumns = normalizeColumnOrders(nextColumns);
  }

  board.columns = nextColumns;
  await board.save();

  return enrichBoard(board);
};

exports.deleteColumn = async (boardId, columnId, user) => {
  ensureValidObjectId(boardId, "board id");
  const board = await Board.findById(boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const project = await getProjectOrThrow(board.projectId);
  ensureCanManageProject(project, user);
  ensureProjectWritable(project);

  if (board.columns.length <= 1) {
    throw new Error("A board must have at least one column");
  }

  const taskCount = await getTaskCountByColumn(board._id, columnId);

  if (taskCount > 0) {
    throw new Error("Cannot delete a column with tasks");
  }

  getColumnOrThrow(board, columnId).deleteOne();
  board.columns = normalizeColumnOrders(board.columns);
  await board.save();

  return enrichBoard(board);
};

exports.setWipLimit = async (boardId, columnId, wipLimit, user) => {
  return exports.updateColumn(boardId, columnId, { wipLimit }, user);
};

exports.getBoardById = async (boardId, user) => {
  ensureValidObjectId(boardId, "board id");
  const board = await Board.findById(boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const project = await getProjectOrThrow(board.projectId);
  ensureCanAccessProject(project, user);

  return enrichBoard(board);
};

exports.ensureBoardWritable = async (boardId) => {
  ensureValidObjectId(boardId, "board id");
  const board = await Board.findById(boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const project = await getProjectOrThrow(board.projectId);
  ensureProjectWritable(project);

  return board;
};

exports.ensureWipLimitForColumn = async (boardId, columnId) => {
  const board = await Board.findById(boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const column = getColumnOrThrow(board, columnId);

  if (!column.wipLimit) {
    return true;
  }

  const currentTaskCount = await getTaskCountByColumn(boardId, columnId);

  if (currentTaskCount >= column.wipLimit) {
    throw new Error(`WIP limit reached for column ${column.name}`);
  }

  return true;
};
