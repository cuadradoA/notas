const express = require("express");
const router = express.Router();

const controller = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/", authenticate, controller.getMyNotifications);
router.patch("/:id/read", authenticate, controller.markAsRead);
router.post("/read-all", authenticate, controller.markAllAsRead);

module.exports = router;
