const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/me", authenticate, controller.getMine);
router.patch("/me", authenticate, controller.updateMine);

module.exports = router;
