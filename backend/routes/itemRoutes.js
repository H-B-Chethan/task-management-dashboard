const express = require("express");
const router = express.Router();
const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getStats,
  exportCSV,
} = require("../controllers/itemController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/stats", getStats);
router.get("/export", exportCSV);
router.get("/", getItems);
router.post("/", createItem);
router.get("/:id", getItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

module.exports = router;
