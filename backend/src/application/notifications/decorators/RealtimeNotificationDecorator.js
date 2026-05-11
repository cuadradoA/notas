const { sendNotification } = require("../../../infrastructure/realtime/socket");
const NotificationChannelDecorator = require("./NotificationChannelDecorator");

class RealtimeNotificationDecorator extends NotificationChannelDecorator {
  async send(payload) {
    const notification = await super.send(payload);

    if (notification) {
      sendNotification(payload.userId.toString(), notification);
    }

    return notification;
  }
}

module.exports = RealtimeNotificationDecorator;
