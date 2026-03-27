const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../domain/entities/User");

exports.register = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    throw new Error("username, email and password are required");
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [
      { username: normalizedUsername },
      { email: normalizedEmail }
    ]
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashed,
    role: "DEVELOPER"
  });

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    description: user.description || "",
    isActive: user.isActive
  };
};

exports.login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) throw new Error("User not found");
  if (!user.isActive) throw new Error("User is deactivated");

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) throw new Error("Invalid password");

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role, username: user.username, email: user.email },
    process.env.JWT_SECRET
  );

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
      description: user.description || "",
      isActive: user.isActive
    }
  };
};
