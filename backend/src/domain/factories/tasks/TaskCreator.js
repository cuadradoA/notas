const { TaskType } = require("../../value-objects/TaskType");

class TaskCreator {
  constructor(type) {
    this.type = TaskType.ensureValid(type);
  }

  create(data) {
    throw new Error("create must be implemented");
  }

  createBaseTask(data) {
    return {
      ...data,
      type: this.type
    };
  }
}

module.exports = TaskCreator;
