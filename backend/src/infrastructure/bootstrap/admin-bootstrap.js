const bcrypt = require("bcrypt");
const User = require("../../domain/entities/User");

const DEFAULT_ADMIN = {
  username: "admin",
  email: "admin@taskflow.local",
  password: "Admin12345!",
  role: "ADMIN"
};

async function ensureDefaultAdmin() {
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email });
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  if (existingAdmin) {
    existingAdmin.username = DEFAULT_ADMIN.username;
    existingAdmin.password = hashedPassword;
    existingAdmin.role = "ADMIN";
    existingAdmin.isActive = true;
    await existingAdmin.save();

    return DEFAULT_ADMIN;
  }

  await User.create({
    username: DEFAULT_ADMIN.username,
    email: DEFAULT_ADMIN.email,
    password: hashedPassword,
    role: DEFAULT_ADMIN.role,
    isActive: true
  });

  return DEFAULT_ADMIN;
}

module.exports = {
  ensureDefaultAdmin,
  DEFAULT_ADMIN
};
