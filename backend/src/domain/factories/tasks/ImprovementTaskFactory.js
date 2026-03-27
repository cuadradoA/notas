const TaskCreator = require("./TaskCreator");
const { TASK_TYPES } = require("../../value-objects/TaskType");

class ImprovementTaskFactory extends TaskCreator {
  constructor() {
    super(TASK_TYPES.IMPROVEMENT);
  }

  create(data) {
    return {
      ...this.createBaseTask(data),
      labels: [{ name: "Improve", color: "#22c55e" }, ...(data.labels || [])]
    };
  }
}

module.exports = ImprovementTaskFactory;
