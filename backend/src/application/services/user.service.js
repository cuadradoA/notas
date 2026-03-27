const User = require("../../domain/entities/User");

function serializeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    description: user.description || "",
    isActive: user.isActive,
    lastLogin: user.lastLogin || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function getUserOrThrow(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

exports.getMyProfile = async (userId) => {
  const user = await getUserOrThrow(userId);
  return serializeUser(user);
};

exports.updateMyProfile = async (userId, payload = {}) => {
  const user = await getUserOrThrow(userId);

  if (payload.username !== undefined) {
    const username = payload.username?.trim();

    if (!username) {
      throw new Error("Username is required");
    }

    const existingUser = await User.findOne({
      _id: { $ne: user._id },
      username
    }).select("_id");

    if (existingUser) {
      throw new Error("Username already exists");
    }

    user.username = username;
  }

  if (payload.avatar !== undefined) {
    user.avatar = payload.avatar?.trim() || "";
  }

  if (payload.description !== undefined) {
    user.description = payload.description?.trim() || "";
  }

  await user.save();
  return serializeUser(user);
};
