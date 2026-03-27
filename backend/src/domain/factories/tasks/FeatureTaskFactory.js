const TaskCreator = require("./TaskCreator");
const { TASK_TYPES } = require("../../value-objects/TaskType");

class FeatureTaskFactory extends TaskCreator {
  constructor() {
    super(TASK_TYPES.FEATURE);
  }

  create(data) {
    return this.createBaseTask(data);
  }
}

module.exports = FeatureTaskFactory;
