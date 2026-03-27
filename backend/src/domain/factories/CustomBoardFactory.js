const BoardFactory = require("./BoardFactory");

class CustomBoardFactory extends BoardFactory {
  create(projectId, data) {
    return {
      projectId,
      name: data.name?.trim() || "Nuevo tablero",
      columns: data.columns || []
    };
  }
}

module.exports = CustomBoardFactory;
