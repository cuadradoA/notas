const express = require("express");
const router = express.Router();
const controller = require("../controllers/board.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/project/:projectId", authenticate, controller.listByProject);
router.post("/project/:projectId", authenticate, controller.createBoard);
router.get("/:boardId", authenticate, controller.getById);
router.post("/:boardId/columns", authenticate, controller.createColumn);
router.patch("/:boardId/columns/:columnId", authenticate, controller.updateColumn);
router.patch("/:boardId/columns/:columnId/wip-limit", authenticate, controller.setWipLimit);
router.delete("/:boardId/columns/:columnId", authenticate, controller.deleteColumn);

module.exports = router;
