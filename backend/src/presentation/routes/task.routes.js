const express = require("express");
const router = express.Router();

const controller = require("../controllers/task.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/board/:boardId", controller.listByBoard);
router.get("/board/:boardId/search", controller.searchByBoard);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id/move", controller.move);
router.patch("/:id/move", controller.move);
router.patch("/:id/assignees", controller.assign);
router.post("/:id/clone", controller.clone);
router.post("/:id/subtasks", controller.addSubtask);
router.patch("/:id/subtasks/:subtaskId", controller.updateSubtask);
router.post("/:id/comments", controller.addComment);
router.patch("/:id/comments/:commentId", controller.updateComment);
router.delete("/:id/comments/:commentId", controller.deleteComment);
router.post("/:id/attachments", controller.addAttachment);
router.post("/:id/time-logs", controller.addTimeLog);
router.post("/:id/undo", controller.undo);
router.delete("/:id", controller.remove);

module.exports = router;
