const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: {
    type: String,
    default: ""
  },
  message: String,
  type: String,
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", schema);
