const AdminService = require("../../application/services/admin.service");

exports.getOverview = async (req, res) => {
  try {
    const data = await AdminService.getOverview();
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const data = await AdminService.updateUser(req.params.id, req.body);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
