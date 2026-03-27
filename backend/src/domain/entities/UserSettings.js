const mongoose = require("mongoose");

const savedFilterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  scope: {
    type: String,
    enum: ["BOARD", "PROJECT"],
    default: "BOARD"
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null
  },
  criteria: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true
  },
  theme: {
    type: String,
    enum: ["dark", "light"],
    default: "dark"
  },
  notificationPreferences: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    events: {
      taskAssigned: { type: Boolean, default: true },
      taskOverdue: { type: Boolean, default: true },
      newComment: { type: Boolean, default: true },
      statusChanged: { type: Boolean, default: true }
    }
  },
  savedFilters: {
    type: [savedFilterSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("UserSettings", schema);
