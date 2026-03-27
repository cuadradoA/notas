const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  avatar: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: "",
    trim: true,
    maxlength: 280
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"],
    default: "DEVELOPER"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, { timestamps: true });

module.exports = mongoose.model("User", schema);
