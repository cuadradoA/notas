class Cloneable {
  clone() {
    throw new Error("clone() must be implemented by the concrete entity");
  }
}

module.exports = Cloneable;
