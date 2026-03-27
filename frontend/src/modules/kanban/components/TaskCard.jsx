function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
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

const TASK_BACKGROUNDS = ["var(--task-yellow)", "var(--task-pink)", "var(--task-blue)", "var(--task-mint)"];

export default function TaskCard({ task, onClick, onDragStart }) {
  const customLabels = (task.labels || []).filter((label) => {
    const normalized = label.name?.trim()?.toUpperCase?.() || "";
    return normalized !== task.type;
  });
  const labelsCount = customLabels.length || 0;
  const toneIndex = (task.priority?.length || 0) % TASK_BACKGROUNDS.length;
  const isArchived = Boolean(task.archivedAt);

  return (
    <article
      draggable={!isArchived}
      onDragStart={(event) => {
        if (isArchived) {
          event.preventDefault();
          return;
        }

        onDragStart?.(event, task);
      }}
      onClick={() => onClick?.(task)}
      className="mb-3 cursor-pointer rounded-[26px] border p-4 transition hover:-translate-y-0.5"
      style={{
        borderColor: isArchived ? "rgba(148, 163, 184, 0.4)" : task.overdue ? "rgba(211, 76, 82, 0.35)" : "rgba(17,24,39,0.10)",
        backgroundColor: task.overdue ? "var(--task-overdue)" : TASK_BACKGROUNDS[(toneIndex + labelsCount) % TASK_BACKGROUNDS.length],
        boxShadow: "0 16px 32px rgba(31, 41, 55, 0.10)",
        opacity: isArchived ? 0.8 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-5" style={{ color: "var(--tint-text)" }}>
          {task.title}
        </h3>
        {isArchived ? (
          <span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: "var(--tint-surface)", color: "var(--tint-text-soft)" }}>
            Archivada
          </span>
        ) : task.overdue ? (
          <span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: "var(--tint-surface)", color: "#ffd5d8" }}>
            Vencida
          </span>
        ) : null}
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6" style={{ color: "var(--tint-text-soft)" }}>
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {customLabels.slice(0, 2).map((label, index) => (
          <span
            key={`${label.name}-${index}`}
            className="rounded-full border px-2 py-1 text-[10px] font-semibold shadow-sm"
            style={{ backgroundColor: label.color || "#334155", color: getLabelTextColor(label.color || "#334155"), borderColor: "rgba(255,255,255,0.18)" }}
          >
            {label.name}
          </span>
        ))}
        {task.type && (
          <span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: "var(--tint-surface)", color: "var(--tint-text-soft)" }}>
            {task.type}
          </span>
        )}
        {task.priority && (
          <span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: "var(--tint-surface)", color: "var(--tint-text-soft)" }}>
            {task.priority}
          </span>
        )}
        {customLabels.length > 2 ? (
          <span className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: "var(--tint-surface)", color: "var(--tint-text-soft)" }}>
            +{customLabels.length - 2}
          </span>
        ) : null}
      </div>

      {task.subtaskCount ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--tint-text-muted)" }}>
            <span>Subtareas</span>
            <span>{task.completedSubtasks}/{task.subtaskCount}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/40">
            <div className="h-1.5 rounded-full" style={{ width: `${task.subtaskProgress}%`, backgroundColor: "var(--tint-text-soft)" }} />
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: "var(--tint-text-muted)" }}>
        <span>{formatDate(task.dueDate)}</span>
        <span>{task.spentHours || 0}h / {task.estimatedHours || 0}h</span>
      </div>

      {!!task.assignees?.length && (
        <div className="mt-3 flex items-center gap-2">
          {task.assignees.slice(0, 4).map((assignee) => (
            <span key={assignee._id} className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold" style={{ borderColor: "var(--tint-border)", backgroundColor: "var(--tint-surface)", color: "var(--tint-text-soft)" }} title={assignee.username || assignee.email}>
              {initials(assignee.username || assignee.email || "U")}
            </span>
          ))}
          <span className="text-[11px]" style={{ color: "var(--tint-text-muted)" }}>{task.commentsCount || 0} comentarios</span>
        </div>
      )}
    </article>
  );
}
