import { useState } from "react";

function formatDateTime(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getLabelTextColor(color) {
  const hex = (color || "").replace("#", "");

  if (hex.length !== 6) {
    return "#ffffff";
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);

  return luminance > 170 ? "#111827" : "#ffffff";
}

function isImageAttachment(attachment) {
  return attachment?.mimeType?.startsWith("image/") || attachment?.contentUrl?.startsWith("data:image/");
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
      return `${actor} registro avance en una subtarea`;
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
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [timeLog, setTimeLog] = useState({ hours: "", description: "" });
  const [cloneWithComments, setCloneWithComments] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState((task?.assignees || []).map((assignee) => assignee._id));

  if (!open || !task) {
    return null;
  }

  const isArchived = Boolean(task.archivedAt);
  const isReadOnly = isArchived;
  const creatorId = task.createdBy?._id || task.createdBy?.id || task.createdBy;
  const canDeleteTask = currentUserId && (creatorId === currentUserId || task.currentUserRole === "ADMIN");

  const toggleAssignee = (assigneeId) => {
    if (isReadOnly) {
      return;
    }

    setSelectedAssignees((prev) => (
      prev.includes(assigneeId)
        ? prev.filter((id) => id !== assigneeId)
        : [...prev, assigneeId]
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#05070d]/80 backdrop-blur-sm">
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0f111a] p-6 text-white shadow-[-24px_0_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Task Detail</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{task.title}</h2>
            <p className="mt-2 text-sm text-gray-400">{task.description || "Sin descripcion"}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-300">Cerrar</button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Estado operativo</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">{task.type}</span>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">{task.priority}</span>
              {task.overdue ? <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-200">Vencida</span> : null}
            </div>
            <p className="mt-4 text-sm text-gray-400">Vence: {formatDateTime(task.dueDate)}</p>
            <p className="mt-1 text-sm text-gray-400">Tiempo: {task.spentHours || 0}h registradas de {task.estimatedHours || 0}h estimadas</p>
            <p className="mt-1 text-sm text-gray-400">Subtareas: {task.completedSubtasks}/{task.subtaskCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Responsables y labels</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(task.labels || []).map((label, index) => (
                <span key={`${label.name}-${index}`} className="rounded-full border px-3 py-1 text-xs font-semibold shadow-sm" style={{ backgroundColor: label.color, color: getLabelTextColor(label.color), borderColor: "rgba(255,255,255,0.14)" }}>
                  {label.name}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(task.assignees || []).map((assignee) => (
                <div key={assignee._id} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-gray-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.04] text-[10px] font-semibold text-white">
                    {initials(assignee.username || assignee.email || "U")}
                  </span>
                  <span>{assignee.username || assignee.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Asignacion</p>
            <button
              onClick={() => onUpdateAssignees?.(selectedAssignees)}
              disabled={busy || isReadOnly}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60"
            >
              Guardar responsables
            </button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {projectMembers.length ? projectMembers.map((member) => (
              <label key={member._id} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2 text-sm text-gray-200">
                <div>
                  <p>{member.username || member.email}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedAssignees.includes(member._id)}
                  onChange={() => toggleAssignee(member._id)}
                  disabled={isReadOnly}
                  className="h-4 w-4 accent-violet-500"
                />
              </label>
            )) : (
              <p className="text-sm text-gray-500">No hay miembros disponibles para asignar.</p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Clonar tarea</p>
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={cloneWithComments} onChange={(event) => setCloneWithComments(event.target.checked)} className="accent-violet-500" />
              Incluir comentarios
            </label>
          </div>
          <button onClick={() => onClone({ includeComments: cloneWithComments })} disabled={busy} className="mt-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">
            {busy ? "Procesando..." : "Clonar tarea"}
          </button>
          <button onClick={() => onUndo?.()} disabled={busy} className="mt-3 ml-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-70">
            Deshacer ultimo cambio
          </button>
          {canDeleteTask ? (
            <button onClick={() => onDeleteTask?.(task)} disabled={busy} className="mt-3 ml-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 disabled:opacity-70">
              Eliminar tarea
            </button>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Subtareas</p>
          {isReadOnly ? <p className="mt-2 text-xs text-amber-200">Esta tarea esta archivada. Puedes verla, pero no editarla.</p> : null}
          <div className="mt-3 grid gap-2">
            {(task.subtasks || []).map((subtask) => (
              <label key={subtask._id} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2 text-sm text-gray-200">
                <div>
                  <p className={subtask.completed ? "line-through text-gray-500" : ""}>{subtask.title}</p>
                  <p className="text-xs text-gray-500">{subtask.completed ? `Completada ${formatDateTime(subtask.completedAt)}` : "Pendiente"}</p>
                </div>
                <input type="checkbox" checked={subtask.completed} disabled={isReadOnly} onChange={(event) => onToggleSubtask(subtask, { completed: event.target.checked })} className="h-4 w-4 accent-violet-500" />
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={subtaskTitle} disabled={isReadOnly} onChange={(event) => setSubtaskTitle(event.target.value)} placeholder="Nueva subtarea" className="flex-1 rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50" />
            <button onClick={() => { onAddSubtask({ title: subtaskTitle }); setSubtaskTitle(""); }} disabled={!subtaskTitle.trim() || busy || isReadOnly} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-50">
              Agregar
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Comentarios</p>
          <div className="mt-3 grid gap-3">
            {(task.comments || []).map((comment) => {
              const canEdit = comment.author?._id === currentUserId;

              return (
                <div key={comment._id} className="rounded-2xl border border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{comment.author?.username || comment.author?.email || "Usuario"}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(comment.updatedAt || comment.createdAt)}</p>
                    </div>
                    {canEdit && !isReadOnly ? (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCommentId(comment._id); setEditingCommentBody(comment.body); }} className="text-xs text-gray-300">Editar</button>
                        <button onClick={() => onDeleteComment(comment)} className="text-xs text-rose-300">Eliminar</button>
                      </div>
                    ) : null}
                  </div>

                  {editingCommentId === comment._id ? (
                    <div className="mt-3 flex gap-2">
                      <textarea value={editingCommentBody} onChange={(event) => setEditingCommentBody(event.target.value)} rows={3} className="flex-1 rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none" />
                      <div className="flex flex-col gap-2">
                        <button onClick={() => { onUpdateComment(comment, { body: editingCommentBody }); setEditingCommentId(null); }} className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-white">Guardar</button>
                        <button onClick={() => setEditingCommentId(null)} className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-gray-400">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-300">{comment.body}</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <textarea value={commentBody} disabled={isReadOnly} onChange={(event) => setCommentBody(event.target.value)} rows={3} placeholder="Agregar comentario" className="flex-1 rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50" />
            <button onClick={() => { onAddComment({ body: commentBody }); setCommentBody(""); }} disabled={!commentBody.trim() || busy || isReadOnly} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-50">
              Enviar
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Adjuntos</p>
          <div className="mt-3 grid gap-2">
            {(task.attachments || []).map((attachment) => (
              <div key={attachment._id} className="rounded-2xl border border-white/10 p-3">
                {isImageAttachment(attachment) ? (
                  <a href={attachment.contentUrl} target="_blank" rel="noreferrer">
                    <img src={attachment.contentUrl} alt={attachment.name} className="h-40 w-full rounded-xl object-cover" />
                  </a>
                ) : null}
                <a href={attachment.contentUrl} download={attachment.name} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-cyan-200">
                  {attachment.name || "Archivo"} - {(Number(attachment.size || 0) / 1024).toFixed(1)} KB
                </a>
                <p className="mt-1 text-xs text-gray-500">{attachment.mimeType || "application/octet-stream"}</p>
              </div>
            ))}
          </div>
          <label className="mt-3 block rounded-2xl border border-dashed border-white/10 px-4 py-4 text-center text-sm text-gray-400">
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
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Registro de tiempo</p>
          <div className="mt-3 grid gap-2">
            {(task.timeLogs || []).map((log) => (
              <div key={log._id} className="rounded-2xl border border-white/10 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white">{log.hours}h</p>
                  <p className="text-xs text-gray-500">{formatDateTime(log.loggedAt)}</p>
                </div>
                <p className="mt-1 text-xs text-gray-400">{log.description || "Sin descripcion"}</p>
                <p className="mt-1 text-xs text-gray-500">{log.user?.username || log.user?.email || "Usuario"}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr_auto]">
            <input type="number" min="0" step="0.5" value={timeLog.hours} disabled={isReadOnly} onChange={(event) => setTimeLog((prev) => ({ ...prev, hours: event.target.value }))} placeholder="Horas" className="rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50" />
            <input value={timeLog.description} disabled={isReadOnly} onChange={(event) => setTimeLog((prev) => ({ ...prev, description: event.target.value }))} placeholder="Descripcion del trabajo realizado" className="rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-white outline-none disabled:opacity-50" />
            <button onClick={() => { onAddTimeLog({ ...timeLog, hours: Number(timeLog.hours) }); setTimeLog({ hours: "", description: "" }); }} disabled={!timeLog.hours || busy || isReadOnly} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-50">
              Registrar
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Historial</p>
          <div className="mt-3 grid gap-2">
            {(task.history || []).map((event) => (
              <div key={event._id} className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-gray-300">
                <p>{describeHistoryEvent(event)}</p>
                <p className="mt-1 text-xs text-gray-500">{formatDateTime(event.date)} - {event.user?.username || event.user?.email || "Sistema"}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
