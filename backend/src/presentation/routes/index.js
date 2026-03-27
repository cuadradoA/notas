const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/projects", require("./project.routes"));
router.use("/tasks", require("./task.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/boards", require("./board.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/users", require("./user.routes"));

module.exports = router;
