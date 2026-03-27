const TASK_TYPES = Object.freeze({
  BUG: "BUG",
  FEATURE: "FEATURE",
  TASK: "TASK",
  IMPROVEMENT: "IMPROVEMENT"
});

class TaskType {
  static values() {
    return Object.values(TASK_TYPES);
  }

  static ensureValid(type) {
    if (!TaskType.values().includes(type)) {
      throw new Error("Invalid task type");
    }

    return type;
  }
}

module.exports = {
  TaskType,
  TASK_TYPES
};
