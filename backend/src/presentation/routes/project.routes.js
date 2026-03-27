const express = require("express");
const router = express.Router();

const controller = require("../controllers/project.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.post("/", authenticate, controller.create);
router.get("/", authenticate, controller.getAll);
router.get("/:id", authenticate, controller.getById);
router.put("/:id", authenticate, controller.update);
router.delete("/:id", authenticate, controller.remove);
router.post("/:id/invite", authenticate, controller.invite);
router.post("/:id/clone", authenticate, controller.clone);
router.post("/:id/archive", authenticate, controller.archive);
router.patch("/:id/status", authenticate, controller.changeStatus);
router.get("/:id/dashboard", authenticate, controller.getDashboard);
router.get("/:id/audit-logs", authenticate, authorize("ADMIN"), controller.getAuditLogs);
router.get("/:id/export.csv", authenticate, controller.exportCsv);
router.get("/:id/export.pdf", authenticate, controller.exportPdf);

module.exports = router;
