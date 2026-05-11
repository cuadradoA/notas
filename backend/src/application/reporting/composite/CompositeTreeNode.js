const ProjectTreeNode = require("./ProjectTreeNode");

class CompositeTreeNode extends ProjectTreeNode {
  constructor({ kind, id, name, meta = {} }) {
    super({ kind, id, name, meta });
    this.children = [];
  }

  add(child) {
    this.children.push(child);
    return this;
  }

  summarize() {
    return this.children.reduce((accumulator, child) => {
      const summary = child.summarize();

      return {
        totalTasks: accumulator.totalTasks + summary.totalTasks,
        completedTasks: accumulator.completedTasks + summary.completedTasks,
        overdueTasks: accumulator.overdueTasks + summary.overdueTasks
      };
    }, {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0
    });
  }

  getTaskDescriptors() {
    return this.children.flatMap((child) => child.getTaskDescriptors());
  }

  toJSON() {
    const summary = this.summarize();

    return {
      kind: this.kind,
      id: this.id,
      name: this.name,
      meta: this.meta,
      summary: {
        ...summary,
        progress: summary.totalTasks
          ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
          : 0
      },
      children: this.children.map((child) => child.toJSON())
    };
  }
}

module.exports = CompositeTreeNode;
