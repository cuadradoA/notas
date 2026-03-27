const TASK_PRIORITIES = Object.freeze({
  BAJA: "BAJA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  URGENTE: "URGENTE"
});

class TaskPriority {
  static values() {
    return Object.values(TASK_PRIORITIES);
  }

  static ensureValid(priority) {
    if (!TaskPriority.values().includes(priority)) {
      throw new Error("Invalid task priority");
    }

    return priority;
  }
}

module.exports = {
  TaskPriority,
  TASK_PRIORITIES
};
