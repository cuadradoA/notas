const ColumnFactory = require("./ColumnFactory");
const ColumnName = require("../../value-objects/ColumnName");
const WipLimit = require("../../value-objects/WipLimit");

class DefaultColumnFactory extends ColumnFactory {
  create(columns = ["Por hacer", "En progreso", "En revision", "Completado"]) {
    return columns.map((name, index) => ({
      name: new ColumnName(name).value,
      order: index + 1,
      wipLimit: new WipLimit(null).value
    }));
  }
}

module.exports = DefaultColumnFactory;
