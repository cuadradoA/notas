const domainEvents = require("../../infrastructure/events/domain-events");
const NotificationService = require("../services/notification.service");
const AuditLogService = require("../services/audit-log.service");

const NOTIFICATION_EVENT_MAP = {
  TASK_ASSIGNED: "taskAssigned",
  TASK_UPDATED: "statusChanged",
  TASK_COMPLETED: "statusChanged",
  TASK_OVERDUE: "taskOverdue",
  TASK_COMMENTED: "newComment",
  TASK_STATUS_CHANGED: "statusChanged"
};

function uniqueRecipients(recipients = []) {
  return [...new Set(recipients.filter(Boolean).map((value) => value.toString()))];
}

let registered = false;

module.exports = function registerEventHandlers() {
  if (registered) {
    return;
  }

  registered = true;

  domainEvents.on("task.event", async (payload) => {
    await AuditLogService.record({
      projectId: payload.projectId,
      taskId: payload.taskId,
      entityType: "TASK",
      entityId: payload.taskId.toString(),
      action: payload.action,
      actorId: payload.actorId,
      meta: payload.meta || {}
    });

    const preferenceKey = NOTIFICATION_EVENT_MAP[payload.notificationType];

    if (preferenceKey) {
      const recipients = uniqueRecipients(payload.recipients);

      for (const recipientId of recipients) {
        if (recipientId === payload.actorId?.toString() && payload.notificationType !== "TASK_OVERDUE") {
          continue;
        }

        await NotificationService.notify(recipientId, payload.message, payload.notificationType, {
          title: payload.title,
          meta: payload.meta,
          preferenceKey,
          emailPayload: payload.emailPayload
        });
      }
    }
  });

  domainEvents.on("project.event", async (payload) => {
    await AuditLogService.record({
      projectId: payload.projectId,
      entityType: "PROJECT",
      entityId: payload.projectId.toString(),
      action: payload.action,
      actorId: payload.actorId,
      meta: payload.meta || {}
    });
  });
};
