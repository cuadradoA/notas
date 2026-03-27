const AuditLog = require("../../domain/entities/AuditLog");

exports.record = async ({
  projectId,
  taskId = null,
  entityType,
  entityId,
  action,
  actorId,
  meta = {}
}) => {
  return AuditLog.create({
    projectId,
    taskId,
    entityType,
    entityId,
    action,
    actorId,
    meta
  });
};

exports.listByProject = async (projectId) => {
  return AuditLog.find({ projectId })
    .populate("actorId", "username email role")
    .sort({ createdAt: -1 })
    .limit(100);
};

exports.listRecent = async () => {
  return AuditLog.find({})
    .populate("actorId", "username email role")
    .sort({ createdAt: -1 })
    .limit(150);
};
