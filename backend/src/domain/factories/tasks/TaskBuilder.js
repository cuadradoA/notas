const { TaskPriority, TASK_PRIORITIES } = require("../../value-objects/TaskPriority");
const { TaskType, TASK_TYPES } = require("../../value-objects/TaskType");

function ensurePositiveOrZero(value, label) {
  const normalized = Number(value);

  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error(`${label} must be greater than or equal to 0`);
  }

  return normalized;
}

class TaskBuilder {
  constructor() {
    this.task = {
      title: "",
      description: "",
      type: TASK_TYPES.TASK,
      priority: TASK_PRIORITIES.MEDIA,
      labels: [],
      assignees: [],
      dueDate: null,
      estimatedHours: 0,
      columnId: null,
      boardId: null,
      subtasks: [],
      attachments: []
    };
  }

  setTitle(title) {
    const normalized = title?.trim();

    if (!normalized) {
      throw new Error("Task title is required");
    }

    this.task.title = normalized;
    return this;
  }

  setDescription(description = "") {
    this.task.description = description?.trim() || "";
    return this;
  }

  setType(type) {
    this.task.type = TaskType.ensureValid(type || TASK_TYPES.TASK);
    return this;
  }

  setPriority(priority) {
    this.task.priority = TaskPriority.ensureValid(priority || TASK_PRIORITIES.MEDIA);
    return this;
  }

  setDueDate(date) {
    if (!date) {
      this.task.dueDate = null;
      return this;
    }

    const normalizedDate = new Date(date);

    if (Number.isNaN(normalizedDate.getTime())) {
      throw new Error("Invalid due date");
    }

    this.task.dueDate = normalizedDate;
    return this;
  }

  setEstimatedHours(hours = 0) {
    this.task.estimatedHours = ensurePositiveOrZero(hours, "estimatedHours");
    return this;
  }

  addLabel(label) {
    const name = label?.name?.trim();

    if (!name) {
      throw new Error("Label name is required");
    }

    this.task.labels.push({
      name,
      color: label.color?.trim() || "#6366f1"
    });
    return this;
  }

  setLabels(labels = []) {
    this.task.labels = [];
    labels.forEach((label) => this.addLabel(label));
    return this;
  }

  assignUser(userId) {
    if (!userId) {
      throw new Error("Assignee id is required");
    }

    if (!this.task.assignees.includes(userId)) {
      this.task.assignees.push(userId);
    }

    return this;
  }

  setAssignees(users = []) {
    this.task.assignees = [];
    users.forEach((userId) => this.assignUser(userId));
    return this;
  }

  setColumn(columnId) {
    if (!columnId) {
      throw new Error("Column id is required");
    }

    this.task.columnId = columnId;
    return this;
  }

  setBoard(boardId) {
    if (!boardId) {
      throw new Error("Board id is required");
    }

    this.task.boardId = boardId;
    return this;
  }

  addSubtask(subtask) {
    const title = subtask?.title?.trim();

    if (!title) {
      throw new Error("Subtask title is required");
    }

    this.task.subtasks.push({
      title,
      completed: Boolean(subtask.completed)
    });
    return this;
  }

  setSubtasks(subtasks = []) {
    this.task.subtasks = [];
    subtasks.forEach((subtask) => this.addSubtask(subtask));
    return this;
  }

  addAttachment(attachment) {
    if (!attachment?.name?.trim()) {
      throw new Error("Attachment name is required");
    }

    const size = ensurePositiveOrZero(attachment.size, "attachment size");

    if (size > 10 * 1024 * 1024) {
      throw new Error("Attachments cannot exceed 10MB");
    }

    this.task.attachments.push({
      name: attachment.name.trim(),
      mimeType: attachment.mimeType || "application/octet-stream",
      size,
      contentUrl: attachment.contentUrl
    });
    return this;
  }

  setAttachments(attachments = []) {
    this.task.attachments = [];
    attachments.forEach((attachment) => this.addAttachment(attachment));
    return this;
  }

  build() {
    if (!this.task.title) {
      throw new Error("Task title is required");
    }

    if (!this.task.columnId || !this.task.boardId) {
      throw new Error("Task must belong to a board and column");
    }

    if (!this.task.assignees.length) {
      throw new Error("Task must have at least one assignee");
    }

    return {
      ...this.task,
      labels: [...this.task.labels],
      assignees: [...this.task.assignees],
      subtasks: [...this.task.subtasks],
      attachments: [...this.task.attachments]
    };
  }
}

module.exports = TaskBuilder;
