const NotificationService = require("../../application/services/notification.service");

exports.getMyNotifications = async (req, res) => {
  try {
    const data = await NotificationService.getMyNotifications(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const data = await NotificationService.markAsRead(req.user.id, req.params.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const data = await NotificationService.markAllAsRead(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
