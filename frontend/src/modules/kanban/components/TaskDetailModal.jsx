import { useEffect, useState } from "react";

function formatDateTime(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function initials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function toId(value) {
  return value?._id || value?.id || value || null;
}

function getLabelTextColor(color) {
  const hex = (color || "").replace("#", "");

  if (hex.length !== 6) {
    return "#ffffff";
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;

  return luminance > 170 ? "#111827" : "#ffffff";
}

function isImageAttachment(attachment) {
  return (
    attachment?.mimeType?.startsWith("image/") ||
    attachment?.contentUrl?.startsWith("data:image/")
  );
}

function describeHistoryEvent(event) {
  const actor = event.user?.username || event.user?.email || "Sistema";

  switch (event.action) {
    case "CREATED":
      return `${actor} creo la tarea`;
    case "MOVED":
      return `${actor} cambio la tarea de columna`;
    case "ASSIGNEES_UPDATED":
      return `${actor} actualizo los responsables`;
    case "SUBTASK_CREATED":
      return `${actor} agrego la subtarea "${event.meta?.title || "sin titulo"}"`;
    case "SUBTASK_UPDATED":
      return `${actor} actualizo una subtarea`;
    case "COMMENT_ADDED":
      return `${actor} agrego un comentario`;
    case "COMMENT_UPDATED":
      return `${actor} edito un comentario`;
    case "COMMENT_DELETED":
      return `${actor} elimino un comentario`;
    case "TIME_LOGGED":
      return `${actor} registro ${event.meta?.hours || 0}h de avance`;
    case "ATTACHMENT_ADDED":
      return `${actor} adjunto ${event.meta?.fileName || "un archivo"}`;
    default:
      return `${actor} realizo ${event.action}`;
  }
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Section({ title, children, aside = null }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.28em] text-gray-500">
          {title}
        </p>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function TaskDetailModal({
  open,
  task,
  busy,
  currentUserId,
  onClose,
  onClone,
  onUndo,
  onAddSubtask,
  onToggleSubtask,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onAddTimeLog,
  onAddAttachment,
  onUpdateAssignees,
  onDeleteTask,
  projectMembers = [],
}) {
  const [subtaskDraft, setSubtaskDraft] = useState({ title: "", assignedTo: "" });
  const [commentBody, setCommentBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [timeLog, setTimeLog] = useState({ hours: "", description: "" });
  const [cloneWithComments, setCloneWithComments] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  useEffect(() => {
    if (!task) {
      return;
    }

    setSelectedAssignees((task.assignees || []).map((assignee) => assignee._id));
    setSubtaskDraft({ title: "", assignedTo: "" });
    setCommentBody("");
    setEditingCommentId(null);
    setEditingCommentBody("");
    setTimeLog({ hours: "", description: "" });
    setCloneWithComments(false);
  }, [task?._id, open]);

  if (!open || !task) {
    return null;
  }

  const isArchived = Boolean(task.archivedAt);
  const isReadOnly = isArchived;
  const creatorId = toId(task.createdBy);
  const isTaskAssignee = (task.assignees || []).some(
    (assignee) => toId(assignee) === currentUserId
  );
  const canAssignSubtasks =
    currentUserId &&
    (isTaskAssignee || creatorId === currentUserId || task.currentUserRole === "ADMIN");
  const canDeleteTask =
    currentUserId &&
    (creatorId === currentUserId || task.currentUserRole === "ADMIN");

  const toggleAssignee = (assigneeId) => {
    if (isReadOnly) {
      return;
    }

    setSelectedAssignees((prev) =>
      prev.includes(assigneeId)
        ? prev.filter((id) => id !== assigneeId)
        : [...prev, assigneeId]
    );
  };

  const handleSubtaskToggle = (subtask, nextCompleted) => {
    if (nextCompleted && !subtask.completed) {
      const confirmed = window.confirm(
        `¿Seguro que deseas marcar como realizada la subtarea "${subtask.title}"?`
      );

      if (!confirmed) {
        return;
      }
    }

    onToggleSubtask(subtask, { completed: nextCompleted });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/84 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1500px] overflow-y-auto rounded-[34px] border border-white/10 bg-[#0f111a] p-6 text-white shadow-[0_36px_120px_rgba(0,0,0,0.48)] lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Task Detail
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {task.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
              {task.description || "Sin descripcion"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
          <div className="grid gap-6">
            <Section title="Estado operativo">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tipo</p>
                  <p className="mt-2 text-lg font-semibold text-white">{task.type}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Prioridad</p>
                  <p className="mt-2 text-lg font-semibold text-white">{task.priority}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Vence</p>
                  <p className="mt-2 text-sm font-medium text-white">{formatDateTime(task.dueDate)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tiempo</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {task.spentHours || 0}h / {task.estimatedHours || 0}h
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Progreso de subtareas</span>
                    <span>
                      {task.completedSubtasks}/{task.subtaskCount}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                      style={{ width: `${task.subtaskProgress || 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {task.overdue ? (
                    <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-200">
                      Vencida
                    </span>
                  ) : null}
                  {task.completedAt ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">
                      Completada
                    </span>
                  ) : null}
                  {isArchived ? (
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">
                      Solo lectura
                    </span>
                  ) : null}
                </div>
              </div>
            </Section>

            <Section title="Subtareas">
              {isReadOnly ? (
                <p className="mb-4 text-xs text-amber-200">
                  Esta tarea esta archivada. Puedes verla, pero no editarla.
                </p>
              ) : null}
              {!isReadOnly && !canAssignSubtasks ? (
                <p className="mb-4 text-xs text-sky-200">
                  Solo un responsable de la tarea o un administrador puede asignar subtareas.
                </p>
              ) : null}

              <div className="grid gap-3">
                {(task.subtasks || []).map((subtask) => (
                  <div
                    key={subtask._id}
                    className="grid gap-3 rounded-[24px] border border-white/10 bg-black/10 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]"
                  >
                    <div>
                      <p
                        className={`text-sm font-medium ${subtask.completed ? "text-gray-500 line-through" : "text-white"}`}
                      >
                        {subtask.title}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>
                          {subtask.completed
                            ? `Completada ${formatDateTime(subtask.completedAt)}`
                            : "Pendiente"}
                        </span>
                        {subtask.completedBy ? (
                          <span>
                            por {subtask.completedBy.username || subtask.completedBy.email}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-gray-500">
                        Responsable
                      </label>
                      <select
                        value={subtask.assignedTo?._id || ""}
                        disabled={busy || isReadOnly || !canAssignSubtasks}
                        onChange={(event) =>
                          onToggleSubtask(subtask, {
                            assignedTo: event.target.value || null,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#090b12] px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
                      >
                        <option value="">Sin asignar</option>
                        {projectMembers.map((member) => (
                          <option key={member._id} value={member._id}>
                            {member.username || member.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-end">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        disabled={busy || isReadOnly}
                        onChange={(event) =>
                          handleSubtaskToggle(subtask, event.target.checked)
                        }
                        className="h-5 w-5 accent-violet-500"
                      />
                    </div>
                  </div>
                ))}

                {!task.subtasks?.length ? (
                  <div className="rounded-[24px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-500">
                    Todavia no hay subtareas.
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 rounded-[24px] border border-white/10 bg-black/10 p-4 md:grid-cols-[minmax(0,1fr)_240px_auto]">
                <input
                  value={subtaskDraft.title}
                  disabled={isReadOnly}
                  onChange={(event) =>
                    setSubtaskDraft((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Nueva subtarea"
                  className="rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50"
                />
                <select
                  value={subtaskDraft.assignedTo}
                  disabled={isReadOnly || !canAssignSubtasks}
                  onChange={(event) =>
                    setSubtaskDraft((prev) => ({
                      ...prev,
                      assignedTo: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50"
                >
                  <option value="">Sin asignar</option>
                  {projectMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.username || member.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    onAddSubtask({
                      title: subtaskDraft.title,
                      assignedTo: subtaskDraft.assignedTo || null,
                    });
                    setSubtaskDraft({ title: "", assignedTo: "" });
                  }}
                  disabled={!subtaskDraft.title.trim() || busy || isReadOnly}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </Section>

            <Section title="Comentarios">
              <div className="grid gap-3">
                {(task.comments || []).map((comment) => {
                  const canEdit = toId(comment.author) === currentUserId;

                  return (
                    <div
                      key={comment._id}
                      className="rounded-[24px] border border-white/10 bg-black/10 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {comment.author?.username || comment.author?.email || "Usuario"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(comment.updatedAt || comment.createdAt)}
                          </p>
                        </div>
                        {canEdit && !isReadOnly ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditingCommentBody(comment.body);
                              }}
                              className="text-xs text-gray-300"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => onDeleteComment(comment)}
                              className="text-xs text-rose-300"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {editingCommentId === comment._id ? (
                        <div className="mt-3 flex gap-2">
                          <textarea
                            value={editingCommentBody}
                            onChange={(event) =>
                              setEditingCommentBody(event.target.value)
                            }
                            rows={3}
                            className="flex-1 rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none"
                          />
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                onUpdateComment(comment, {
                                  body: editingCommentBody,
                                });
                                setEditingCommentId(null);
                              }}
                              className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-white"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-gray-300">
                          {comment.body}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-3">
                <textarea
                  value={commentBody}
                  disabled={isReadOnly}
                  onChange={(event) => setCommentBody(event.target.value)}
                  rows={3}
                  placeholder="Agregar comentario"
                  className="flex-1 rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => {
                    onAddComment({ body: commentBody });
                    setCommentBody("");
                  }}
                  disabled={!commentBody.trim() || busy || isReadOnly}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-white disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </Section>

            <Section title="Adjuntos">
              <div className="grid gap-3 md:grid-cols-2">
                {(task.attachments || []).map((attachment) => (
                  <div
                    key={attachment._id}
                    className="rounded-[24px] border border-white/10 bg-black/10 p-4"
                  >
                    {isImageAttachment(attachment) ? (
                      <a href={attachment.contentUrl} target="_blank" rel="noreferrer">
                        <img
                          src={attachment.contentUrl}
                          alt={attachment.name}
                          className="h-48 w-full rounded-xl object-cover"
                        />
                      </a>
                    ) : null}
                    <a
                      href={attachment.contentUrl}
                      download={attachment.name}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block text-sm text-cyan-200"
                    >
                      {attachment.name || "Archivo"} -{" "}
                      {(Number(attachment.size || 0) / 1024).toFixed(1)} KB
                    </a>
                    <p className="mt-1 text-xs text-gray-500">
                      {attachment.mimeType || "application/octet-stream"}
                    </p>
                  </div>
                ))}
              </div>

              <label className="mt-4 block rounded-[24px] border border-dashed border-white/10 px-4 py-5 text-center text-sm text-gray-400">
                Subir archivo
                <input
                  type="file"
                  className="hidden"
                  disabled={isReadOnly}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    if (file.size > 10 * 1024 * 1024) {
                      window.alert("Cada archivo debe pesar maximo 10 MB");
                      event.target.value = "";
                      return;
                    }

                    const contentUrl = await readFileAsDataUrl(file);
                    await onAddAttachment({
                      name: file.name || "archivo",
                      mimeType: file.type,
                      size: file.size,
                      contentUrl,
                    });
                    event.target.value = "";
                  }}
                />
              </label>
            </Section>

            <Section title="Historial">
              <div className="grid gap-2">
                {(task.history || []).map((event) => (
                  <div
                    key={event._id}
                    className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-gray-300"
                  >
                    <p>{describeHistoryEvent(event)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateTime(event.date)} -{" "}
                      {event.user?.username || event.user?.email || "Sistema"}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="grid gap-6">
            <Section
              title="Responsables y labels"
              aside={
                <button
                  onClick={() => onUpdateAssignees?.(selectedAssignees)}
                  disabled={busy || isReadOnly}
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60"
                >
                  Guardar
                </button>
              }
            >
              <div className="flex flex-wrap gap-2">
                {(task.labels || []).map((label, index) => (
                  <span
                    key={`${label.name}-${index}`}
                    className="rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
                    style={{
                      backgroundColor: label.color,
                      color: getLabelTextColor(label.color),
                      borderColor: "rgba(255,255,255,0.14)",
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                {projectMembers.length ? (
                  projectMembers.map((member) => (
                    <label
                      key={member._id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-[11px] font-semibold text-white">
                          {initials(member.username || member.email)}
                        </span>
                        <div>
                          <p>{member.username || member.email}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(member._id)}
                        onChange={() => toggleAssignee(member._id)}
                        disabled={isReadOnly}
                        className="h-4 w-4 accent-violet-500"
                      />
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay miembros disponibles para asignar.
                  </p>
                )}
              </div>
            </Section>

            <Section title="Acciones rapidas">
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={cloneWithComments}
                  onChange={(event) =>
                    setCloneWithComments(event.target.checked)
                  }
                  className="accent-violet-500"
                />
                Incluir comentarios al clonar
              </label>

              <div className="mt-4 grid gap-3">
                <button
                  onClick={() => onClone({ includeComments: cloneWithComments })}
                  disabled={busy}
                  className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {busy ? "Procesando..." : "Clonar tarea"}
                </button>
                <button
                  onClick={() => onUndo?.()}
                  disabled={busy}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-70"
                >
                  Deshacer ultimo cambio
                </button>
                {canDeleteTask ? (
                  <button
                    onClick={() => onDeleteTask?.(task)}
                    disabled={busy}
                    className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 disabled:opacity-70"
                  >
                    Eliminar tarea
                  </button>
                ) : null}
              </div>
            </Section>

            <Section title="Registro de tiempo">
              <div className="grid gap-2">
                {(task.timeLogs || []).map((log) => (
                  <div
                    key={log._id}
                    className="rounded-2xl border border-white/10 bg-black/10 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-white">{log.hours}h</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(log.loggedAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {log.description || "Sin descripcion"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {log.user?.username || log.user?.email || "Usuario"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={timeLog.hours}
                  disabled={isReadOnly}
                  onChange={(event) =>
                    setTimeLog((prev) => ({
                      ...prev,
                      hours: event.target.value,
                    }))
                  }
                  placeholder="Horas"
                  className="rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50"
                />
                <input
                  value={timeLog.description}
                  disabled={isReadOnly}
                  onChange={(event) =>
                    setTimeLog((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Descripcion del trabajo realizado"
                  className="rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => {
                    onAddTimeLog({
                      ...timeLog,
                      hours: Number(timeLog.hours),
                    });
                    setTimeLog({ hours: "", description: "" });
                  }}
                  disabled={!timeLog.hours || busy || isReadOnly}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-50"
                >
                  Registrar
                </button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
