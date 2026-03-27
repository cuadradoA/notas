const mongoose = require("mongoose");
const Task = require("../../domain/entities/Task");
const Board = require("../../domain/entities/Board");
const Project = require("../../domain/entities/Project");
const ProjectMember = require("../../domain/entities/ProjectMember");
const User = require("../../domain/entities/User");
const TaskFactory = require("../../domain/factories/tasks/TaskFactory");
const TaskBuilder = require("../../domain/factories/tasks/TaskBuilder");
const ProjectService = require("./project.service");
const BoardService = require("./board.service");
const { serializeTask } = require("../serializers/task.serializer");
const domainEvents = require("../../infrastructure/events/domain-events");
const UndoService = require("./undo.service");

function ensureValidObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${label}`);
  }
}

async function getTaskOrThrow(taskId, { populate = false } = {}) {
  ensureValidObjectId(taskId, "task id");

  const query = Task.findById(taskId);

  if (populate) {
    query
      .populate("createdBy", "username email role")
      .populate("assignees", "username email role")
      .populate("comments.author", "username email role")
      .populate("attachments.uploadedBy", "username email role")
      .populate("timeLogs.user", "username email role")
      .populate("history.user", "username email role")
      .populate("subtasks.completedBy", "username email role");
  }

  const task = await query;

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
}

async function getBoardContext(boardId) {
  ensureValidObjectId(boardId, "board id");
  const board = await Board.findById(boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const project = await Project.findById(board.projectId).populate("members", "username email role");

  if (!project) {
    throw new Error("Project not found");
  }

  return { board, project };
}

function ensureProjectMember(project, user) {
  const isMember = (project.members || []).some((member) => member._id.toString() === user.id);
  const isCreator = project.createdBy?.toString?.() === user.id;

  if (!isMember && !isCreator && user.role !== "ADMIN") {
    throw new Error("No permission to access this task");
  }
}

async function ensureTaskAssignmentPermission(project, user) {
  if (project.createdBy?.toString?.() === user.id || user.role === "ADMIN") {
    return true;
  }

  const membership = await ProjectMember.findOne({
    projectId: project._id,
    userId: user.id,
    status: "ACTIVE"
  }).select("role");

  if (membership?.role === "OWNER") {
    return true;
  }

  throw new Error("No permission to assign this task");
}

async function ensureAssigneesBelongToProject(projectId, assigneeIds = []) {
  if (!assigneeIds.length) {
    return;
  }

  const activeMembers = await ProjectMember.find({
    projectId,
    status: "ACTIVE",
    userId: { $ne: null }
  }).select("userId");
  const validMemberIds = new Set(activeMembers.map((member) => member.userId.toString()));
  const invalidAssignee = assigneeIds.find((assigneeId) => !validMemberIds.has(assigneeId.toString()));

  if (invalidAssignee) {
    throw new Error("All assignees must belong to the project");
  }
}

function ensureAttachmentPayload(attachments = []) {
  attachments.forEach((attachment) => {
    if (!attachment?.name?.trim()) {
      throw new Error("Attachment name is required");
    }

    if (!attachment?.contentUrl) {
      throw new Error("Attachment content is required");
    }
  });
}

function resolveCompletionDate(board, columnId) {
  const targetColumn = board.columns.id(columnId);
  const targetColumnName = targetColumn?.name?.toLowerCase?.() || "";
  return targetColumnName.includes("complet") ? new Date() : null;
}

function resolveArchiveDate(board, columnId) {
  return resolveCompletionDate(board, columnId);
}

function buildTaskBuilder(data) {
  const builder = new TaskBuilder()
    .setTitle(data.title)
    .setDescription(data.description)
    .setType(data.type)
    .setPriority(data.priority)
    .setDueDate(data.dueDate)
    .setEstimatedHours(data.estimatedHours || 0)
    .setLabels(data.labels || [])
    .setAssignees(data.assignees || [])
    .setColumn(data.columnId)
    .setBoard(data.boardId)
    .setSubtasks(data.subtasks || [])
    .setAttachments(data.attachments || []);

  return builder.build();
}

function toObjectIdString(value) {
  return value?._id?.toString?.() || value?.toString?.() || null;
}

async function getAdminRecipientIds() {
  const admins = await User.find({ role: "ADMIN" }).select("_id");
  return admins.map((admin) => admin._id.toString());
}

async function resolveTaskNotificationRecipients(task, actorId, { includeAssignees = false } = {}) {
  const recipients = new Set();

  if (task.createdBy) {
    recipients.add(toObjectIdString(task.createdBy));
  }

  for (const adminId of await getAdminRecipientIds()) {
    recipients.add(adminId);
  }

  if (includeAssignees) {
    for (const assignee of task.assignees || []) {
      recipients.add(toObjectIdString(assignee));
    }
  }

  if (actorId) {
    recipients.delete(actorId.toString());
  }

  return [...recipients].filter(Boolean);
}

function buildTaskNotificationMeta(task, project, actor, extra = {}) {
  return {
    taskId: task._id.toString(),
    taskTitle: task.title,
    projectId: project._id.toString(),
    projectName: project.name,
    actorId: actor?.id || actor?._id?.toString?.() || null,
    actorName: actor?.username || actor?.email || "Usuario",
    ...extra
  };
}

async function ensureTaskEditable(task, user, project) {
  ensureProjectMember(project, user);
  await ProjectService.ensureTaskIsWritable(task._id);

  if (task.archivedAt) {
    throw new Error("Archived tasks are read-only");
  }
}

function emitTaskEvent(task, actorId, action, title, message, notificationType, recipients = [], meta = {}) {
  domainEvents.emit("task.event", {
    projectId: task.projectId,
    taskId: task._id,
    action,
    actorId,
    title,
    message,
    notificationType,
    recipients,
    meta
  });
}

function ensureCanDeleteTask(task, user) {
  const creatorId = toObjectIdString(task.createdBy);

  if (user.role === "ADMIN" || creatorId === user.id) {
    return true;
  }

  throw new Error("Only the task creator or an admin can delete this task");
}

async function ensureOverdueNotification(task, project) {
  if (!task?.dueDate || task.completedAt || task.archivedAt || !task.isOverdue?.()) {
    return;
  }

  const alreadyNotified = (task.history || []).some((event) => event.action === "OVERDUE_NOTIFIED");

  if (alreadyNotified) {
    return;
  }

  task.history.push({
    action: "OVERDUE_NOTIFIED",
    fromColumnId: null,
    toColumnId: null,
    user: task.createdBy?._id || task.createdBy,
    date: new Date(),
    meta: {}
  });
  await task.save();

  emitTaskEvent(
    { ...task.toObject(), projectId: project._id },
    toObjectIdString(task.createdBy),
    "TASK_OVERDUE_DETECTED",
    "Tarea vencida",
    `La tarea ${task.title} esta vencida`,
    "TASK_OVERDUE",
    task.assignees.map((assignee) => assignee._id || assignee),
    buildTaskNotificationMeta(task, project, null, {
      actionType: "OVERDUE"
    })
  );
}

exports.createTask = async (data, user) => {
  const { board, project } = await getBoardContext(data.boardId);
  ensureProjectMember(project, user);
  await ProjectService.ensureProjectIsWritableFromBoard(data.boardId);
  await BoardService.ensureWipLimitForColumn(data.boardId, data.columnId);

  await ensureAssigneesBelongToProject(project._id, data.assignees || []);
  ensureAttachmentPayload(data.attachments || []);

  const builtTask = buildTaskBuilder(data);
  const finalTask = TaskFactory.create(builtTask.type, builtTask);
  const task = await Task.create({
    ...finalTask,
    createdBy: user.id,
    completedAt: resolveCompletionDate(board, builtTask.columnId),
    archivedAt: resolveArchiveDate(board, builtTask.columnId),
    attachments: (finalTask.attachments || []).map((attachment) => ({
      ...attachment,
      uploadedBy: user.id
    })),
    history: [{
      action: "CREATED",
      fromColumnId: null,
      toColumnId: builtTask.columnId,
      user: user.id,
      date: new Date(),
      meta: {
        type: builtTask.type
      }
    }]
  });

  const detailedTask = await getTaskOrThrow(task._id, { populate: true });
  if (detailedTask.assignees.length) {
    emitTaskEvent(
      { ...detailedTask.toObject(), projectId: project._id },
      user.id,
      "TASK_ASSIGNED",
      "Nueva tarea asignada",
      `${user.username || user.email || "Alguien"} te asigno "${detailedTask.title}" en ${project.name}`,
      "TASK_ASSIGNED",
      detailedTask.assignees.map((assignee) => assignee._id),
      buildTaskNotificationMeta(detailedTask, project, user, {
        assignmentType: "INITIAL"
      })
    );
  }

  if (detailedTask.isOverdue()) {
    emitTaskEvent(
      { ...detailedTask.toObject(), projectId: project._id },
      user.id,
      "TASK_OVERDUE_DETECTED",
      "Tarea vencida",
      `La tarea ${detailedTask.title} esta vencida`,
      "TASK_OVERDUE",
      detailedTask.assignees.map((assignee) => assignee._id)
    );
  }

  return serializeTask(detailedTask, { detail: true });
};

exports.getTaskById = async (taskId, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  ensureProjectMember(project, user);
  await ensureOverdueNotification(task, project);
  return serializeTask(task, { detail: true });
};

exports.listTasksByBoard = async (boardId, user) => {
  const { project } = await getBoardContext(boardId);
  ensureProjectMember(project, user);

  const tasks = await Task.find({ boardId })
    .populate("assignees", "username email role")
    .sort({ createdAt: -1 });

  for (const task of tasks) {
    await ensureOverdueNotification(task, project);
  }

  return tasks.map((task) => serializeTask(task));
};

exports.moveTask = async (taskId, newColumnId, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { board, project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);
  await BoardService.ensureWipLimitForColumn(task.boardId, newColumnId);

  const oldColumn = task.columnId;

  task.history.push({
    action: "MOVED",
    fromColumnId: oldColumn,
    toColumnId: newColumnId,
    user: user.id,
    date: new Date(),
    meta: {}
  });
  task.columnId = newColumnId;
  task.completedAt = resolveCompletionDate(board, newColumnId);
  task.archivedAt = resolveArchiveDate(board, newColumnId);
  await task.save();

  UndoService.register({
    userId: user.id,
    scope: `task:${taskId}`,
    action: {
      undo: async () => {
        task.columnId = oldColumn;
        task.completedAt = resolveCompletionDate(board, oldColumn);
        task.archivedAt = resolveArchiveDate(board, oldColumn);
        task.history.push({
          action: "UNDO_MOVE",
          fromColumnId: newColumnId,
          toColumnId: oldColumn,
          user: user.id,
          date: new Date(),
          meta: {}
        });
        await task.save();
        return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
      }
    }
  });

  const updatedTask = await getTaskOrThrow(taskId, { populate: true });
  const completed = Boolean(updatedTask.completedAt);
  const recipients = await resolveTaskNotificationRecipients(updatedTask, user.id, {
    includeAssignees: true
  });
  emitTaskEvent(
    { ...updatedTask.toObject(), projectId: project._id },
    user.id,
    completed ? "TASK_COMPLETED" : "TASK_UPDATED",
    completed ? "Tarea completada" : "Actualizacion de tarea",
    completed
      ? `${user.username || user.email || "Alguien"} completo "${updatedTask.title}" en ${project.name}`
      : `${user.username || user.email || "Alguien"} movio "${updatedTask.title}" a una nueva columna en ${project.name}`,
    completed ? "TASK_COMPLETED" : "TASK_UPDATED",
    recipients,
    {
      ...buildTaskNotificationMeta(updatedTask, project, user, {
        actionType: completed ? "COMPLETED" : "STATUS_CHANGED"
      }),
      fromColumnId: oldColumn,
      toColumnId: newColumnId
    }
  );

  return serializeTask(updatedTask, { detail: true });
};

exports.cloneTask = async (taskId, options, user) => {
  const sourceTask = await getTaskOrThrow(taskId, { populate: true });
  const { board, project } = await getBoardContext(sourceTask.boardId);
  ensureProjectMember(project, user);
  await ProjectService.ensureTaskIsWritable(taskId);
  await BoardService.ensureWipLimitForColumn(sourceTask.boardId, sourceTask.columnId);
  await ensureAssigneesBelongToProject(project._id, sourceTask.assignees.map((assignee) => assignee._id.toString()));

  const prototypePayload = sourceTask.clone({
    includeComments: Boolean(options?.includeComments),
    includeAttachments: Boolean(options?.includeAttachments),
    includeTimeLogs: false,
    titleSuffix: options?.titleSuffix || " (Copia)"
  });
  const builtTask = buildTaskBuilder({
    ...prototypePayload,
    boardId: sourceTask.boardId.toString(),
    columnId: sourceTask.columnId,
    title: options?.title || prototypePayload.title,
    assignees: sourceTask.assignees.map((assignee) => assignee._id?.toString?.() || assignee.toString()),
    attachments: (prototypePayload.attachments || []).map((attachment) => ({
      ...attachment,
      contentUrl: attachment.contentUrl
    }))
  });
  const task = await Task.create({
    ...TaskFactory.create(builtTask.type, builtTask),
    createdBy: user.id,
    completedAt: resolveCompletionDate(board, builtTask.columnId),
    archivedAt: resolveArchiveDate(board, builtTask.columnId),
    comments: Boolean(options?.includeComments)
      ? (prototypePayload.comments || []).map((comment) => ({
          body: comment.body,
          author: comment.author || user.id
        }))
      : [],
    attachments: (prototypePayload.attachments || []).map((attachment) => ({
      ...attachment,
      uploadedBy: attachment.uploadedBy || user.id
    })),
    history: [{
      action: "CLONED",
      fromColumnId: null,
      toColumnId: builtTask.columnId,
      user: user.id,
      date: new Date(),
      meta: {
        sourceTaskId: sourceTask._id.toString()
      }
    }]
  });

  const clonedTask = await getTaskOrThrow(task._id, { populate: true });
  return serializeTask(clonedTask, { detail: true });
};

exports.addSubtask = async (taskId, data, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);

  if (!data?.title?.trim()) {
    throw new Error("Subtask title is required");
  }

  task.subtasks.push({
    title: data.title.trim(),
    completed: false
  });
  task.history.push({
    action: "SUBTASK_CREATED",
    user: user.id,
    date: new Date(),
    meta: { title: data.title.trim() }
  });

  await task.save();
  const createdSubtask = task.subtasks[task.subtasks.length - 1];
  UndoService.register({
    userId: user.id,
    scope: `task:${taskId}`,
    action: {
      undo: async () => {
        const undoTask = await getTaskOrThrow(taskId, { populate: true });
        undoTask.subtasks.id(createdSubtask._id)?.deleteOne();
        await undoTask.save();
        return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
      }
    }
  });
  return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
};

exports.updateSubtask = async (taskId, subtaskId, data, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);

  const subtask = task.subtasks.id(subtaskId);

  if (!subtask) {
    throw new Error("Subtask not found");
  }

  if (data.title !== undefined) {
    if (!data.title?.trim()) {
      throw new Error("Subtask title is required");
    }

    subtask.title = data.title.trim();
  }

  if (data.completed !== undefined) {
    subtask.completed = Boolean(data.completed);
    subtask.completedAt = subtask.completed ? new Date() : null;
    subtask.completedBy = subtask.completed ? user.id : null;
  }

  task.history.push({
    action: "SUBTASK_UPDATED",
    user: user.id,
    date: new Date(),
    meta: {
      subtaskId: subtask._id.toString(),
      completed: subtask.completed
    }
  });

  await task.save();
  const updatedTask = await getTaskOrThrow(taskId, { populate: true });

  if (data.completed !== undefined) {
    const recipients = await resolveTaskNotificationRecipients(updatedTask, user.id, {
      includeAssignees: true
    });
    emitTaskEvent(
      { ...updatedTask.toObject(), projectId: project._id },
      user.id,
      "TASK_UPDATED",
      "Avance registrado",
      `${user.username || user.email || "Alguien"} actualizo una subtarea de "${updatedTask.title}" en ${project.name}`,
      "TASK_UPDATED",
      recipients,
      buildTaskNotificationMeta(updatedTask, project, user, {
        actionType: "SUBTASK_PROGRESS",
        subtaskId: subtask._id.toString(),
        subtaskTitle: subtask.title,
        completed: subtask.completed
      })
    );
  }

  return serializeTask(updatedTask, { detail: true });
};

exports.addComment = async (taskId, data, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);

  if (!data?.body?.trim()) {
    throw new Error("Comment body is required");
  }

  task.comments.push({
    body: data.body.trim(),
    author: user.id
  });
  task.history.push({
    action: "COMMENT_ADDED",
    user: user.id,
    date: new Date(),
    meta: {}
  });

  await task.save();
  const createdComment = task.comments[task.comments.length - 1];
  UndoService.register({
    userId: user.id,
    scope: `task:${taskId}`,
    action: {
      undo: async () => {
        const undoTask = await getTaskOrThrow(taskId, { populate: true });
        undoTask.comments.id(createdComment._id)?.deleteOne();
        await undoTask.save();
        return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
      }
    }
  });
  const commentRecipients = await resolveTaskNotificationRecipients(task, user.id, {
    includeAssignees: true
  });
  emitTaskEvent(
    { ...task.toObject(), projectId: project._id, _id: task._id },
    user.id,
    "TASK_COMMENT_ADDED",
    "Nuevo comentario",
    `${user.username || user.email || "Alguien"} comento "${task.title}" en ${project.name}`,
    "TASK_COMMENTED",
    commentRecipients,
    buildTaskNotificationMeta(task, project, user, {
      actionType: "COMMENT_ADDED",
      commentId: createdComment?._id?.toString?.()
    })
  );
  return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
};

exports.updateComment = async (taskId, commentId, data, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);

  const comment = task.comments.id(commentId);

  if (!comment) {
    throw new Error("Comment not found");
  }

  const authorId = comment.author?._id?.toString?.() || comment.author?.toString?.();

  if (authorId !== user.id) {
    throw new Error("You can only edit your own comments");
  }

  if (!data?.body?.trim()) {
    throw new Error("Comment body is required");
  }

  comment.body = data.body.trim();
  task.history.push({
    action: "COMMENT_UPDATED",
    user: user.id,
    date: new Date(),
    meta: {
      commentId: comment._id.toString()
    }
  });

  await task.save();
  return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
};

exports.deleteComment = async (taskId, commentId, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);

  const comment = task.comments.id(commentId);

  if (!comment) {
    throw new Error("Comment not found");
  }

  const authorId = comment.author?._id?.toString?.() || comment.author?.toString?.();

  if (authorId !== user.id) {
    throw new Error("You can only delete your own comments");
  }

  comment.deleteOne();
  task.history.push({
    action: "COMMENT_DELETED",
    user: user.id,
    date: new Date(),
    meta: {
      commentId
    }
  });

  await task.save();
  return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
};

exports.addAttachment = async (taskId, data, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);
  ensureAttachmentPayload([data]);

  const size = Number(data.size || 0);

  if (!Number.isFinite(size) || size < 0) {
    throw new Error("Attachment size must be valid");
  }

  if (size > 10 * 1024 * 1024) {
    throw new Error("Attachments cannot exceed 10MB");
  }

  task.attachments.push({
    name: data.name?.trim(),
    mimeType: data.mimeType || "application/octet-stream",
    size,
    contentUrl: data.contentUrl,
    uploadedBy: user.id
  });
  task.history.push({
    action: "ATTACHMENT_ADDED",
    user: user.id,
    date: new Date(),
    meta: {
      fileName: data.name?.trim()
    }
  });

  await task.save();
  return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
};

exports.addTimeLog = async (taskId, data, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  await ensureTaskEditable(task, user, project);

  const hours = Number(data.hours);

  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error("Time log hours must be greater than or equal to 0");
  }

  task.timeLogs.push({
    hours,
    description: data.description?.trim() || "",
    user: user.id,
    loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date()
  });
  task.history.push({
    action: "TIME_LOGGED",
    user: user.id,
    date: new Date(),
    meta: {
      hours
    }
  });

  await task.save();
  const createdTimeLog = task.timeLogs[task.timeLogs.length - 1];
  UndoService.register({
    userId: user.id,
    scope: `task:${taskId}`,
    action: {
      undo: async () => {
        const undoTask = await getTaskOrThrow(taskId, { populate: true });
        undoTask.timeLogs.id(createdTimeLog._id)?.deleteOne();
        await undoTask.save();
        return serializeTask(await getTaskOrThrow(taskId, { populate: true }), { detail: true });
      }
    }
  });
  const updatedTask = await getTaskOrThrow(taskId, { populate: true });
  const recipients = await resolveTaskNotificationRecipients(updatedTask, user.id, {
    includeAssignees: true
  });
  emitTaskEvent(
    { ...updatedTask.toObject(), projectId: project._id },
    user.id,
    "TASK_UPDATED",
    "Avance registrado",
    `${user.username || user.email || "Alguien"} registro ${hours}h en "${updatedTask.title}" de ${project.name}`,
    "TASK_UPDATED",
    recipients,
    buildTaskNotificationMeta(updatedTask, project, user, {
      actionType: "PROGRESS_LOGGED",
      hours
    })
  );
  return serializeTask(updatedTask, { detail: true });
};

exports.assignTask = async (taskId, assigneeIds, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  ensureProjectMember(project, user);
  await ensureTaskAssignmentPermission(project, user);
  await ensureTaskEditable(task, user, project);

  const normalizedAssigneeIds = [...new Set((assigneeIds || []).map((assigneeId) => assigneeId.toString()))];

  if (!normalizedAssigneeIds.length) {
    throw new Error("Task must have at least one assignee");
  }

  await ensureAssigneesBelongToProject(project._id, normalizedAssigneeIds);

  const previousAssignees = new Set((task.assignees || []).map((assignee) => toObjectIdString(assignee)));
  const nextAssignees = new Set(normalizedAssigneeIds);
  const addedAssignees = normalizedAssigneeIds.filter((assigneeId) => !previousAssignees.has(assigneeId));
  const removedAssignees = [...previousAssignees].filter((assigneeId) => !nextAssignees.has(assigneeId));

  task.assignees = normalizedAssigneeIds;
  task.history.push({
    action: "ASSIGNEES_UPDATED",
    user: user.id,
    date: new Date(),
    meta: {
      assignedUserIds: normalizedAssigneeIds,
      addedUserIds: addedAssignees,
      removedUserIds: removedAssignees
    }
  });

  await task.save();
  const updatedTask = await getTaskOrThrow(taskId, { populate: true });

  if (addedAssignees.length) {
    emitTaskEvent(
      { ...updatedTask.toObject(), projectId: project._id },
      user.id,
      "TASK_ASSIGNED",
      "Nueva asignacion",
      `${user.username || user.email || "Alguien"} te asigno "${updatedTask.title}" en ${project.name}`,
      "TASK_ASSIGNED",
      addedAssignees,
      buildTaskNotificationMeta(updatedTask, project, user, {
        actionType: "ASSIGNED",
        assignedUserIds: normalizedAssigneeIds,
        addedUserIds: addedAssignees
      })
    );
  }

  return serializeTask(updatedTask, { detail: true });
};

exports.deleteTask = async (taskId, user) => {
  const task = await getTaskOrThrow(taskId, { populate: true });
  const { project } = await getBoardContext(task.boardId);
  ensureProjectMember(project, user);
  await ProjectService.ensureTaskIsWritable(taskId);
  ensureCanDeleteTask(task, user);

  emitTaskEvent(
    { ...task.toObject(), projectId: project._id },
    user.id,
    "TASK_DELETED",
    "Tarea eliminada",
    `${user.username || user.email || "Alguien"} elimino "${task.title}" en ${project.name}`,
    null,
    [],
    buildTaskNotificationMeta(task, project, user, {
      actionType: "DELETED"
    })
  );

  await Task.findByIdAndDelete(task._id);

  return {
    success: true,
    deletedTaskId: task._id.toString()
  };
};

exports.undoLastTaskAction = async (taskId, user) => {
  await getTaskOrThrow(taskId, { populate: true });
  return UndoService.consume({ userId: user.id, scope: `task:${taskId}` });
};

exports.searchBoardTasks = async (boardId, user, filters) => {
  const { project } = await getBoardContext(boardId);
  ensureProjectMember(project, user);

  const query = { boardId };

  if (!filters.includeArchived) {
    query.archivedAt = null;
  }

  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } }
    ];
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.assignee) {
    query.assignees = filters.assignee;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.dueDate = {};
    if (filters.dateFrom) {
      query.dueDate.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.dueDate.$lte = new Date(filters.dateTo);
    }
  }

  if (filters.label) {
    query["labels.name"] = filters.label;
  }

  const tasks = await Task.find(query).populate("assignees", "username email role").sort({ createdAt: -1 });
  for (const task of tasks) {
    await ensureOverdueNotification(task, project);
  }
  return tasks.map((task) => serializeTask(task));
};
