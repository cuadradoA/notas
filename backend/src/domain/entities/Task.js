const mongoose = require("mongoose");
const { TASK_TYPES } = require("../value-objects/TaskType");
const { TASK_PRIORITIES } = require("../value-objects/TaskPriority");

const labelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true,
    default: "#64748b"
  }
}, { _id: false });

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mimeType: {
    type: String,
    default: "application/octet-stream"
  },
  size: {
    type: Number,
    required: true,
    min: 0,
    max: 10 * 1024 * 1024
  },
  contentUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const timeLogSchema = new mongoose.Schema({
  hours: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: "",
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const taskHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  fromColumnId: {
    type: String,
    default: null
  },
  toColumnId: {
    type: String,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  type: {
    type: String,
    enum: Object.values(TASK_TYPES),
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(TASK_PRIORITIES),
    required: true
  },
  labels: {
    type: [labelSchema],
    default: []
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  spentHours: {
    type: Number,
    default: 0,
    min: 0
  },
  columnId: {
    type: String,
    required: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  archivedAt: {
    type: Date,
    default: null
  },
  subtasks: {
    type: [subtaskSchema],
    default: []
  },
  comments: {
    type: [commentSchema],
    default: []
  },
  attachments: {
    type: [attachmentSchema],
    default: []
  },
  timeLogs: {
    type: [timeLogSchema],
    default: []
  },
  history: {
    type: [taskHistorySchema],
    default: []
  }
}, { timestamps: true });

taskSchema.virtual("subtaskProgress").get(function getSubtaskProgress() {
  if (!this.subtasks.length) {
    return 0;
  }

  const completed = this.subtasks.filter((subtask) => subtask.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

taskSchema.methods.isOverdue = function isOverdue() {
  return Boolean(this.dueDate && this.dueDate.getTime() < Date.now() && !this.completedAt);
};

taskSchema.methods.clone = function clone(options = {}) {
  const {
    includeComments = false,
    includeAttachments = false,
    includeTimeLogs = false,
    titleSuffix = " (Copia)"
  } = options;
  const cloned = this.toObject({ virtuals: false });

  delete cloned._id;
  delete cloned.createdAt;
  delete cloned.updatedAt;
  delete cloned.__v;

  cloned.title = `${cloned.title}${titleSuffix}`;
  cloned.comments = includeComments
    ? (cloned.comments || []).map((comment) => {
        const { _id, createdAt, updatedAt, ...rest } = comment;
        return rest;
      })
    : [];
  cloned.attachments = includeAttachments
    ? (cloned.attachments || []).map((attachment) => {
        const { _id, createdAt, ...rest } = attachment;
        return rest;
      })
    : [];
  cloned.timeLogs = includeTimeLogs
    ? (cloned.timeLogs || []).map((timeLog) => {
        const { _id, ...rest } = timeLog;
        return rest;
      })
    : [];
  cloned.history = [];
  cloned.completedAt = null;
  cloned.subtasks = (cloned.subtasks || []).map((subtask) => ({
    title: subtask.title,
    completed: false,
    completedAt: null,
    completedBy: null
  }));

  return cloned;
};

taskSchema.pre("save", function updateSpentHours() {
  this.spentHours = (this.timeLogs || []).reduce((total, log) => total + Number(log.hours || 0), 0);
});

taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Task", taskSchema);
