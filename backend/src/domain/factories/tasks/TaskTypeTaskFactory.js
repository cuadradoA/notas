const TaskCreator = require("./TaskCreator");
const { TASK_TYPES } = require("../../value-objects/TaskType");

class TaskTypeTaskFactory extends TaskCreator {
  constructor() {
    super(TASK_TYPES.TASK);
  }

  create(data) {
    return this.createBaseTask(data);
  }
}

module.exports = TaskTypeTaskFactory;
