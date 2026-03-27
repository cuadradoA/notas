const UserSettingsService = require("../../application/services/user-settings.service");

exports.getMine = async (req, res) => {
  try {
    const settings = await UserSettingsService.getMySettings(req.user.id);
    res.json(settings);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateMine = async (req, res) => {
  try {
    const settings = await UserSettingsService.updateMySettings(req.user.id, req.body);
    res.json(settings);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.saveFilter = async (req, res) => {
  try {
    const settings = await UserSettingsService.saveFilter(req.user.id, req.body);
    res.json(settings);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.deleteFilter = async (req, res) => {
  try {
    const settings = await UserSettingsService.removeFilter(req.user.id, req.params.id);
    res.json(settings);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
