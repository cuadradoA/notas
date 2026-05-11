const CachedProjectInsightsProxy = require("../proxy/CachedProjectInsightsProxy");
const MongoProjectInsightsGateway = require("../proxy/MongoProjectInsightsGateway");
const CompositeTreeNode = require("../composite/CompositeTreeNode");
const TaskLeafNode = require("../composite/TaskLeafNode");
const columnSemanticFlyweightFactory = require("../flyweights/ColumnSemanticFlyweightFactory");
const StandardProjectReport = require("../bridge/StandardProjectReport");
const CsvProjectReportRenderer = require("../bridge/renderers/CsvProjectReportRenderer");
const PdfProjectReportRenderer = require("../bridge/renderers/PdfProjectReportRenderer");
const JsonProjectReportRenderer = require("../bridge/renderers/JsonProjectReportRenderer");

function sortColumns(columns = []) {
  return [...columns].sort((a, b) => a.order - b.order);
}

function resolveRenderer(format) {
  switch (format) {
    case "csv":
      return new CsvProjectReportRenderer();
    case "pdf":
      return new PdfProjectReportRenderer();
    case "json":
      return new JsonProjectReportRenderer();
    default:
      throw new Error(`Unsupported report format: ${format}`);
  }
}

function toStartOfWeekIso(date) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  return startOfWeek.toISOString().slice(0, 10);
}

class ProjectReportingFacade {
  constructor() {
    this.gatewayFactory = () => new CachedProjectInsightsProxy(new MongoProjectInsightsGateway());
  }

  async buildProjectTree(project) {
    const gateway = this.gatewayFactory();
    const boards = await gateway.getBoards(project._id);
    const tasks = await gateway.getTasks(project._id);
    const tasksByBoard = tasks.reduce((accumulator, task) => {
      const boardKey = task.boardId?.toString?.() || task.boardId;
      accumulator[boardKey] = [...(accumulator[boardKey] || []), task];
      return accumulator;
    }, {});
    const projectNode = new CompositeTreeNode({
      kind: "PROJECT",
      id: project._id.toString(),
      name: project.name,
      meta: {
        status: project.status
      }
    });

    for (const board of boards) {
      const boardNode = new CompositeTreeNode({
        kind: "BOARD",
        id: board._id.toString(),
        name: board.name,
        meta: {
          projectId: project._id.toString()
        }
      });
      const boardTasks = tasksByBoard[board._id.toString()] || [];

      for (const column of sortColumns(board.columns)) {
        const semantic = columnSemanticFlyweightFactory.get(column);
        const columnNode = new CompositeTreeNode({
          kind: "COLUMN",
          id: column._id.toString(),
          name: column.name,
          meta: {
            order: column.order,
            wipLimit: column.wipLimit,
            isCompletedColumn: semantic.isCompletedColumn
          }
        });
        const variants = new Set([column._id.toString(), column.name]);

        boardTasks
          .filter((task) => variants.has(task.columnId?.toString?.() || task.columnId))
          .forEach((task) => {
            const assignees = (task.assignees || []).map((assignee) => assignee.username || assignee.email).filter(Boolean);
            const completed = Boolean(task.completedAt) || semantic.isCompletedColumn;
            const overdue = Boolean(task.dueDate && new Date(task.dueDate).getTime() < Date.now() && !completed);

            columnNode.add(new TaskLeafNode({
              id: task._id.toString(),
              title: task.title,
              type: task.type,
              priority: task.priority,
              statusLabel: column.name,
              boardId: board._id.toString(),
              boardName: board.name,
              columnId: column._id.toString(),
              columnName: column.name,
              dueDate: task.dueDate || null,
              estimatedHours: task.estimatedHours || 0,
              spentHours: task.spentHours || 0,
              completed,
              overdue,
              assignees,
              updatedAt: task.updatedAt,
              createdAt: task.createdAt
            }));
          });

        boardNode.add(columnNode);
      }

      projectNode.add(boardNode);
    }

    return projectNode;
  }

  async buildSnapshot(project) {
    const projectTree = await this.buildProjectTree(project);
    const overview = projectTree.summarize();
    const tasks = projectTree.getTaskDescriptors();
    const tasksByStatus = tasks.reduce((accumulator, task) => {
      accumulator[task.statusLabel] = (accumulator[task.statusLabel] || 0) + 1;
      return accumulator;
    }, {});
    const tasksByUser = tasks.reduce((accumulator, task) => {
      if (!task.assignees.length) {
        accumulator["Sin asignar"] = (accumulator["Sin asignar"] || 0) + 1;
        return accumulator;
      }

      task.assignees.forEach((assignee) => {
        accumulator[assignee] = (accumulator[assignee] || 0) + 1;
      });

      return accumulator;
    }, {});
    const completedByWeek = tasks
      .filter((task) => task.completed)
      .reduce((accumulator, task) => {
        const key = toStartOfWeekIso(task.updatedAt || task.createdAt || new Date());
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {});

    return {
      project: {
        _id: project._id,
        name: project.name,
        status: project.status
      },
      overview: {
        totalTasks: overview.totalTasks,
        completedTasks: overview.completedTasks,
        overdueTasks: overview.overdueTasks,
        progress: overview.totalTasks
          ? Math.round((overview.completedTasks / overview.totalTasks) * 100)
          : 0
      },
      tasksByStatus,
      tasksByUser,
      completedByWeek,
      tasks,
      structure: projectTree.toJSON()
    };
  }

  async getDashboard(project) {
    const snapshot = await this.buildSnapshot(project);

    return {
      project: snapshot.project,
      overview: snapshot.overview,
      tasksByStatus: snapshot.tasksByStatus,
      tasksByUser: snapshot.tasksByUser,
      completedByWeek: snapshot.completedByWeek
    };
  }

  async getStructure(project) {
    const snapshot = await this.buildSnapshot(project);
    return snapshot.structure;
  }

  async export(project, format) {
    const snapshot = await this.buildSnapshot(project);
    const report = new StandardProjectReport(resolveRenderer(format));
    return report.export(snapshot);
  }

  async getOverviewMetrics(project) {
    const snapshot = await this.buildSnapshot(project);
    return snapshot.overview;
  }
}

module.exports = new ProjectReportingFacade();
