const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  wipLimit: {
    type: Number,
    default: null
  }
}, { _id: true });

const boardSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  name: {
    type: String,
    default: "Tablero principal",
    trim: true
  },
  columns: {
    type: [columnSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Board", boardSchema);
