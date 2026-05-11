const NotificationChannelDecorator = require("./NotificationChannelDecorator");

class UserPreferenceNotificationDecorator extends NotificationChannelDecorator {
  constructor(channel, userSettingsService) {
    super(channel);
    this.userSettingsService = userSettingsService;
  }

  async send(payload) {
    const preferences = await this.userSettingsService.getNotificationPreferences(payload.userId);
    const preferenceKey = payload.options?.preferenceKey;

    if (preferenceKey && preferences?.events?.[preferenceKey] === false) {
      return null;
    }

    if (!preferences?.inApp) {
      return null;
    }

    return super.send(payload);
  }
}

module.exports = UserPreferenceNotificationDecorator;
