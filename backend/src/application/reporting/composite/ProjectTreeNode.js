class ProjectTreeNode {
  constructor({ kind, id, name, meta = {} }) {
    this.kind = kind;
    this.id = id;
    this.name = name;
    this.meta = meta;
  }

  summarize() {
    throw new Error("summarize() must be implemented");
  }

  getTaskDescriptors() {
    throw new Error("getTaskDescriptors() must be implemented");
  }

  toJSON() {
    throw new Error("toJSON() must be implemented");
  }
}

module.exports = ProjectTreeNode;
