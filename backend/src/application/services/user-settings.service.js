const UserSettings = require("../../domain/entities/UserSettings");

async function getOrCreate(userId) {
  let settings = await UserSettings.findOne({ userId });

  if (!settings) {
    settings = await UserSettings.create({ userId });
  }

  return settings;
}

exports.getMySettings = async (userId) => {
  return getOrCreate(userId);
};

exports.updateMySettings = async (userId, payload) => {
  const settings = await getOrCreate(userId);

  if (payload.theme) {
    settings.theme = payload.theme;
  }

  if (payload.notificationPreferences) {
    settings.notificationPreferences = {
      ...settings.notificationPreferences.toObject(),
      ...payload.notificationPreferences,
      events: {
        ...settings.notificationPreferences.events.toObject(),
        ...(payload.notificationPreferences.events || {})
      }
    };
  }

  if (Array.isArray(payload.savedFilters)) {
    settings.savedFilters = payload.savedFilters;
  }

  await settings.save();
  return settings;
};

exports.saveFilter = async (userId, payload) => {
  const settings = await getOrCreate(userId);
  settings.savedFilters.push({
    name: payload.name,
    scope: payload.scope || "BOARD",
    projectId: payload.projectId || null,
    criteria: payload.criteria || {}
  });
  await settings.save();
  return settings;
};

exports.removeFilter = async (userId, filterId) => {
  const settings = await getOrCreate(userId);
  settings.savedFilters.id(filterId)?.deleteOne();
  await settings.save();
  return settings;
};

exports.getNotificationPreferences = async (userId) => {
  const settings = await getOrCreate(userId);
  return settings.notificationPreferences;
};
