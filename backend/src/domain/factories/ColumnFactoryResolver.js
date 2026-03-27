const DefaultColumnFactory = require("./DefaultColumnFactory");
const CustomColumnFactory = require("./CustomColumnFactory");

class ColumnFactoryResolver {
  static create(type) {
    switch (type) {
      case "default":
        return new DefaultColumnFactory();
      case "custom":
        return new CustomColumnFactory();
      default:
        throw new Error("Unsupported column factory type");
    }
  }
}

module.exports = ColumnFactoryResolver;
