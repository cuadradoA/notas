const { TaskType } = require("../value-objects/TaskType");

class TaskFactory {
  static create(type, data) {
    const validType = TaskType.ensureValid(type);

    switch (validType) {
      case "BUG":
        return {
          ...data,
          type: validType,
          labels: [{ name: "Bug", color: "#ef4444" }, ...(data.labels || [])]
        };
      case "FEATURE":
        return {
          ...data,
          type: validType
        };
      case "TASK":
        return {
          ...data,
          type: validType
        };
      case "IMPROVEMENT":
        return {
          ...data,
          type: validType,
          labels: [{ name: "Improve", color: "#22c55e" }, ...(data.labels || [])]
        };
      default:
        throw new Error("Invalid task type");
    }
  }
}

module.exports = TaskFactory;
