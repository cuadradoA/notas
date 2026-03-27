const NewProjectCreator = require("./NewProjectCreator");
const ClonedProjectCreator = require("./ClonedProjectCreator");

class ProjectCreatorFactory {
  static create(type) {
    switch (type) {
      case "new":
        return new NewProjectCreator();
      case "clone":
        return new ClonedProjectCreator();
      default:
        throw new Error("Unsupported project creator type");
    }
  }
}

module.exports = ProjectCreatorFactory;
