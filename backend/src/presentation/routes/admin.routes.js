const express = require("express");
const router = express.Router();
const controller = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.use(authenticate, authorize("ADMIN"));

router.get("/overview", controller.getOverview);
router.patch("/users/:id", controller.updateUser);

module.exports = router;
