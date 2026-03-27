const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ["OWNER", "MEMBER"],
    default: "MEMBER"
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INVITED"],
    default: "INVITED"
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  joinedAt: Date
}, { timestamps: true });

projectMemberSchema.index({ projectId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("ProjectMember", projectMemberSchema);
