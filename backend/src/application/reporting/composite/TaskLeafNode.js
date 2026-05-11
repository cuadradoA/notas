const ProjectTreeNode = require("./ProjectTreeNode");

class TaskLeafNode extends ProjectTreeNode {
  constructor(descriptor) {
    super({
      kind: "TASK",
      id: descriptor.id,
      name: descriptor.title,
      meta: descriptor
    });

    this.descriptor = descriptor;
  }

  summarize() {
    return {
      totalTasks: 1,
      completedTasks: this.descriptor.completed ? 1 : 0,
      overdueTasks: this.descriptor.overdue ? 1 : 0
    };
  }

  getTaskDescriptors() {
    return [this.descriptor];
  }

  toJSON() {
    return {
      kind: this.kind,
      id: this.id,
      name: this.name,
      meta: this.meta
    };
  }
}

module.exports = TaskLeafNode;
