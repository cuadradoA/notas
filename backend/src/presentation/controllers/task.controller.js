const TaskService = require("../../application/services/task.service");

function respond(action) {
  return async (req, res) => {
    try {
      const result = await action(req, res);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };
}

exports.create = respond((req) => TaskService.createTask(req.body, req.user));
exports.getById = respond((req) => TaskService.getTaskById(req.params.id, req.user));
exports.listByBoard = respond((req) => TaskService.listTasksByBoard(req.params.boardId, req.user));
exports.move = respond((req) => TaskService.moveTask(req.params.id, req.body.columnId, req.user));
exports.assign = respond((req) => TaskService.assignTask(req.params.id, req.body.assignees || [], req.user));
exports.clone = respond((req) => TaskService.cloneTask(req.params.id, req.body, req.user));
exports.addSubtask = respond((req) => TaskService.addSubtask(req.params.id, req.body, req.user));
exports.updateSubtask = respond((req) => TaskService.updateSubtask(req.params.id, req.params.subtaskId, req.body, req.user));
exports.addComment = respond((req) => TaskService.addComment(req.params.id, req.body, req.user));
exports.updateComment = respond((req) => TaskService.updateComment(req.params.id, req.params.commentId, req.body, req.user));
exports.deleteComment = respond((req) => TaskService.deleteComment(req.params.id, req.params.commentId, req.user));
exports.addAttachment = respond((req) => TaskService.addAttachment(req.params.id, req.body, req.user));
exports.addTimeLog = respond((req) => TaskService.addTimeLog(req.params.id, req.body, req.user));
exports.undo = respond((req) => TaskService.undoLastTaskAction(req.params.id, req.user));
exports.searchByBoard = respond((req) => TaskService.searchBoardTasks(req.params.boardId, req.user, req.query));
exports.remove = respond((req) => TaskService.deleteTask(req.params.id, req.user));
