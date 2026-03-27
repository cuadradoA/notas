function toId(value) {
  return value?._id?.toString?.() || value?.toString?.() || value || null;
}

function buildUserSummary(user) {
  if (!user) {
    return null;
  }

  return {
    _id: toId(user),
    username: user.username,
    email: user.email,
    role: user.role
  };
}

function serializeTask(task, { detail = false } = {}) {
  if (!task) {
    return null;
  }

  const source = typeof task.toObject === "function"
    ? task.toObject({ virtuals: true })
    : task;
  const completedSubtasks = (source.subtasks || []).filter((subtask) => subtask.completed).length;
  const subtaskProgress = source.subtasks?.length
    ? Math.round((completedSubtasks / source.subtasks.length) * 100)
    : 0;
  const overdue = Boolean(
    source.dueDate &&
    new Date(source.dueDate).getTime() < Date.now() &&
    !source.completedAt
  );

  const base = {
    _id: source._id,
    title: source.title,
    description: source.description,
    type: source.type,
    priority: source.priority,
    dueDate: source.dueDate,
    estimatedHours: source.estimatedHours || 0,
    spentHours: source.spentHours || 0,
    columnId: source.columnId,
    boardId: source.boardId,
    labels: source.labels || [],
    createdBy: buildUserSummary(source.createdBy),
    assignees: (source.assignees || []).map(buildUserSummary).filter(Boolean),
    attachmentsCount: source.attachments?.length || 0,
    commentsCount: source.comments?.length || 0,
    subtaskCount: source.subtasks?.length || 0,
    completedSubtasks,
    subtaskProgress,
    overdue,
    completedAt: source.completedAt || null,
    archivedAt: source.archivedAt || null,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };

  if (!detail) {
    return base;
  }

  return {
    ...base,
    subtasks: (source.subtasks || []).map((subtask) => ({
      _id: subtask._id,
      title: subtask.title,
      completed: subtask.completed,
      completedAt: subtask.completedAt || null,
      completedBy: buildUserSummary(subtask.completedBy)
    })),
    comments: (source.comments || []).map((comment) => ({
      _id: comment._id,
      body: comment.body,
      author: buildUserSummary(comment.author),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    })),
    attachments: (source.attachments || []).map((attachment) => ({
      _id: attachment._id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      contentUrl: attachment.contentUrl,
      uploadedBy: buildUserSummary(attachment.uploadedBy),
      createdAt: attachment.createdAt
    })),
    timeLogs: (source.timeLogs || []).map((timeLog) => ({
      _id: timeLog._id,
      hours: timeLog.hours,
      description: timeLog.description,
      loggedAt: timeLog.loggedAt,
      user: buildUserSummary(timeLog.user)
    })),
    history: (source.history || []).map((event) => ({
      _id: event._id,
      action: event.action,
      fromColumnId: event.fromColumnId || null,
      toColumnId: event.toColumnId || null,
      user: buildUserSummary(event.user),
      date: event.date,
      meta: event.meta || {}
    }))
  };
}

module.exports = {
  serializeTask
};
