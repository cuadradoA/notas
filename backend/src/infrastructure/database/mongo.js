const mongoose = require("mongoose");

class MongoSingleton {
  static instance = null;

  constructor() {
    this.connectionPromise = null;
  }

  static getInstance() {
    if (!MongoSingleton.instance) {
      MongoSingleton.instance = new MongoSingleton();
    }

    return MongoSingleton.instance;
  }

  async connect() {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    if (!this.connectionPromise) {
      this.connectionPromise = mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
      });
    }

    try {
      await this.connectionPromise;
      console.log("MongoDB connected");
      return mongoose.connection;
    } catch (error) {
      this.connectionPromise = null;
      console.error("Mongo connection error:", error.message);
      throw error;
    }
  }
}

module.exports = MongoSingleton.getInstance();
