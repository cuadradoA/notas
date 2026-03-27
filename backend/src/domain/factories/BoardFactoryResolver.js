const DefaultBoardFactory = require("./DefaultBoardFactory");
const CustomBoardFactory = require("./CustomBoardFactory");

class BoardFactoryResolver {
  static create(type) {
    switch (type) {
      case "default":
        return new DefaultBoardFactory();
      case "custom":
        return new CustomBoardFactory();
      default:
        throw new Error("Unsupported board factory type");
    }
  }
}

module.exports = BoardFactoryResolver;
