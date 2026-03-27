const express = require("express");
const router = express.Router();
const controller = require("../controllers/settings.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/me", authenticate, controller.getMine);
router.patch("/me", authenticate, controller.updateMine);
router.post("/me/filters", authenticate, controller.saveFilter);
router.delete("/me/filters/:id", authenticate, controller.deleteFilter);

module.exports = router;
