const BoardFactory = require("./BoardFactory");
const ColumnFactoryResolver = require("../columns/ColumnFactoryResolver");

class DefaultBoardFactory extends BoardFactory {
  create(projectId) {
    const defaultColumnFactory = ColumnFactoryResolver.create("default");

    return {
      projectId,
      name: "Tablero principal",
      columns: defaultColumnFactory.create()
    };
  }
}

module.exports = DefaultBoardFactory;
