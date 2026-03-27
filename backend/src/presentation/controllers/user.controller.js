const UserService = require("../../application/services/user.service");

exports.getMine = async (req, res) => {
  try {
    const user = await UserService.getMyProfile(req.user.id);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateMine = async (req, res) => {
  try {
    const user = await UserService.updateMyProfile(req.user.id, req.body);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
