const AuthService = require("../../application/services/auth.service");

exports.register = async (req, res) => {
  try {
    const user = await AuthService.register(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await AuthService.login(req.body);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};