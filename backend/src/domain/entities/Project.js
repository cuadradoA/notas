const mongoose = require("mongoose");
const { PROJECT_STATUSES } = require("../value-objects/ProjectStatus");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  startDate: {
    type: Date,
    required: true
  },
  estimatedEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(PROJECT_STATUSES),
    default: PROJECT_STATUSES.PLANIFICADO
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  templateSourceProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null
  },
  archivedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

projectSchema.methods.clone = function clone(options = {}) {
  const cloned = this.toObject();
  const {
    name = `${cloned.name} (Copia)`,
    description = cloned.description,
    startDate = new Date(),
    estimatedEndDate = cloned.estimatedEndDate || new Date()
  } = options;

  delete cloned._id;
  delete cloned.createdAt;
  delete cloned.updatedAt;
  delete cloned.__v;

  return {
    ...cloned,
    name,
    description,
    startDate,
    estimatedEndDate,
    status: PROJECT_STATUSES.PLANIFICADO,
    archivedAt: null
  };
};

module.exports = mongoose.model("Project", projectSchema);
