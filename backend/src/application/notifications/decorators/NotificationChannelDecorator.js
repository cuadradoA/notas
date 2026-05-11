const NotificationChannel = require("../NotificationChannel");

class NotificationChannelDecorator extends NotificationChannel {
  constructor(channel) {
    super();
    this.channel = channel;
  }

  async send(payload) {
    return this.channel.send(payload);
  }
}

module.exports = NotificationChannelDecorator;
