const UserSettingsService = require("./user-settings.service");
const DatabaseNotificationChannel = require("../notifications/DatabaseNotificationChannel");
const UserPreferenceNotificationDecorator = require("../notifications/decorators/UserPreferenceNotificationDecorator");
const RealtimeNotificationDecorator = require("../notifications/decorators/RealtimeNotificationDecorator");
const Notification = require("../../domain/entities/Notification");

const notificationChannel = new UserPreferenceNotificationDecorator(
  new RealtimeNotificationDecorator(new DatabaseNotificationChannel()),
  UserSettingsService
);

exports.notify = async (userId, message, type = "INFO", options = {}) => {
  return notificationChannel.send({
    userId,
    message,
    type,
    options
  });
};

exports.getMyNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
};

exports.markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

exports.markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return { success: true };
};
