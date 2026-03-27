const { TaskType, TASK_TYPES } = require("../../value-objects/TaskType");
const BugTaskFactory = require("./BugTaskFactory");
const FeatureTaskFactory = require("./FeatureTaskFactory");
const TaskTypeTaskFactory = require("./TaskTypeTaskFactory");
const ImprovementTaskFactory = require("./ImprovementTaskFactory");

class TaskFactory {
  static creators = new Map([
    [TASK_TYPES.BUG, new BugTaskFactory()],
    [TASK_TYPES.FEATURE, new FeatureTaskFactory()],
    [TASK_TYPES.TASK, new TaskTypeTaskFactory()],
    [TASK_TYPES.IMPROVEMENT, new ImprovementTaskFactory()]
  ]);

  static resolve(type) {
    const validType = TaskType.ensureValid(type);
    const creator = TaskFactory.creators.get(validType);

    if (!creator) {
      throw new Error("Invalid task type");
    }

    return creator;
  }

  static create(type, data) {
    return TaskFactory.resolve(type).create(data);
  }
}

module.exports = TaskFactory;
