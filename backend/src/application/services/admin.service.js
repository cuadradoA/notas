const User = require("../../domain/entities/User");
const Project = require("../../domain/entities/Project");
const Board = require("../../domain/entities/Board");
const Task = require("../../domain/entities/Task");
const AuditLogService = require("./audit-log.service");

async function buildActiveProjectsSummary() {
  const projects = await Project.find({ status: { $ne: "ARCHIVADO" } })
    .populate("members", "username email role")
    .sort({ createdAt: -1 });

  const summaries = await Promise.all(projects.map(async (project) => {
    const boards = await Board.find({ projectId: project._id }).select("_id columns");
    const boardIds = boards.map((board) => board._id);
    const tasks = boardIds.length ? await Task.find({ boardId: { $in: boardIds }, archivedAt: null }).populate("assignees", "username email") : [];
    const completedColumnIds = new Set(
      boards.flatMap((board) =>
        (board.columns || [])
          .filter((column) => column.name.toLowerCase().includes("complet"))
          .map((column) => column._id.toString())
      )
    );
    const completedTasks = tasks.filter((task) => completedColumnIds.has(task.columnId?.toString?.())).length;
    const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate.getTime() < Date.now() && !completedColumnIds.has(task.columnId?.toString?.())).length;

    return {
      _id: project._id,
      name: project.name,
      status: project.status,
      memberCount: project.members?.length || 0,
      totalTasks: tasks.length,
      overdueTasks,
      progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    };
  }));

  return summaries;
}

async function buildArchivedTasksSummary() {
  const tasks = await Task.find({ archivedAt: { $ne: null } })
    .sort({ archivedAt: -1, updatedAt: -1 })
    .limit(100)
    .populate("createdBy", "username email")
    .lean();

  if (!tasks.length) {
    return [];
  }

  const boardIds = [...new Set(tasks.map((task) => task.boardId?.toString()).filter(Boolean))];
  const boards = await Board.find({ _id: { $in: boardIds } }).select("projectId name").lean();
  const projects = await Project.find({ _id: { $in: [...new Set(boards.map((board) => board.projectId?.toString()).filter(Boolean))] } }).select("name").lean();

  const boardMap = new Map(boards.map((board) => [board._id.toString(), board]));
  const projectMap = new Map(projects.map((project) => [project._id.toString(), project]));

  return tasks.map((task) => {
    const board = boardMap.get(task.boardId?.toString());
    const project = board ? projectMap.get(board.projectId?.toString()) : null;

    return {
      _id: task._id,
      title: task.title,
      priority: task.priority,
      type: task.type,
      archivedAt: task.archivedAt,
      completedAt: task.completedAt || null,
      boardName: board?.name || "Sin tablero",
      projectName: project?.name || "Sin proyecto",
      createdBy: task.createdBy || null,
    };
  });
}

exports.getOverview = async () => {
  const [users, activeProjects, recentAuditLogs, archivedTasks] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).select("username email role isActive createdAt lastLogin"),
    buildActiveProjectsSummary(),
    AuditLogService.listRecent(),
    buildArchivedTasksSummary()
  ]);

  return {
    users,
    activeProjects,
    recentAuditLogs,
    archivedTasks
  };
};

exports.updateUser = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (payload.role) {
    user.role = payload.role;
  }

  if (payload.isActive !== undefined) {
    user.isActive = Boolean(payload.isActive);
  }

  await user.save();

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  };
};
