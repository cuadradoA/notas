const EventEmitter = require("events");

class DomainEvents extends EventEmitter {}

module.exports = new DomainEvents();
