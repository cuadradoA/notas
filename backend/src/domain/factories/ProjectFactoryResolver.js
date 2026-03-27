const NewProjectFactory = require("./NewProjectFactory");
const CloneProjectFactory = require("./CloneProjectFactory");

class ProjectFactoryResolver {
  static create(type) {
    switch (type) {
      case "new":
        return new NewProjectFactory();
      case "clone":
        return new CloneProjectFactory();
      default:
        throw new Error("Unsupported project factory type");
    }
  }
}

module.exports = ProjectFactoryResolver;
