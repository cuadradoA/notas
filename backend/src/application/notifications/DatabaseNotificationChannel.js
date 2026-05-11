const Notification = require("../../domain/entities/Notification");
const NotificationChannel = require("./NotificationChannel");

class DatabaseNotificationChannel extends NotificationChannel {
  async send(payload) {
    return Notification.create({
      userId: payload.userId,
      title: payload.options?.title || "",
      message: payload.message,
      type: payload.type,
      meta: payload.options?.meta || {},
      read: false
    });
  }
}

module.exports = DatabaseNotificationChannel;
