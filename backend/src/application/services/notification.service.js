const Notification = require("../../domain/entities/Notification");
const { sendNotification } = require("../../infrastructure/realtime/socket");
const UserSettingsService = require("./user-settings.service");

exports.notify = async (userId, message, type = "INFO", options = {}) => {
  const preferences = await UserSettingsService.getNotificationPreferences(userId);
  const preferenceKey = options.preferenceKey;

  if (preferenceKey && preferences?.events?.[preferenceKey] === false) {
    return null;
  }

  if (!preferences?.inApp) {
    return null;
  }

  const notification = await Notification.create({
    userId,
    title: options.title || "",
    message,
    type,
    meta: options.meta || {},
    read: false
  });

  sendNotification(userId.toString(), notification);
  return notification;
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
