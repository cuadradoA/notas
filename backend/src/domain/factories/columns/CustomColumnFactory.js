const ColumnFactory = require("./ColumnFactory");
const ColumnName = require("../../value-objects/ColumnName");
const WipLimit = require("../../value-objects/WipLimit");

class CustomColumnFactory extends ColumnFactory {
  create(data, context = {}) {
    return {
      name: new ColumnName(data.name).value,
      order: context.order,
      wipLimit: new WipLimit(data.wipLimit).value
    };
  }
}

module.exports = CustomColumnFactory;
