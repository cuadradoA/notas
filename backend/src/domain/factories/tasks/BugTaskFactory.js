const TaskCreator = require("./TaskCreator");
const { TASK_TYPES } = require("../../value-objects/TaskType");

class BugTaskFactory extends TaskCreator {
  constructor() {
    super(TASK_TYPES.BUG);
  }

  create(data) {
    return {
      ...this.createBaseTask(data),
      labels: [{ name: "Bug", color: "#ef4444" }, ...(data.labels || [])]
    };
  }
}

module.exports = BugTaskFactory;
