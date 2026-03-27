import TaskCard from "./TaskCard";

const COLUMN_BACKGROUNDS = [
  "var(--column-blue)",
  "var(--column-pink)",
  "var(--column-yellow)",
  "var(--column-mint)",
];

export default function Column({
  column,
  onRename,
  onReorder,
  onDelete,
  onSetWipLimit,
  onAddTask,
  onTaskClick,
  onTaskDragStart,
  onTaskDrop,
  readOnly,
}) {
  const isAtLimit = column.wipLimit && column.taskCount >= column.wipLimit;
  const columnColor = COLUMN_BACKGROUNDS[(column.order - 1 + COLUMN_BACKGROUNDS.length) % COLUMN_BACKGROUNDS.length];

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => onTaskDrop?.(event, column)}
      className="min-h-[280px] w-[320px] shrink-0 rounded-[28px] border p-4"
      style={{ borderColor: "var(--app-border)", backgroundColor: columnColor }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--tint-text)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--tint-text)" }}>{column.name}</h3>
            <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "var(--tint-surface)", color: "var(--tint-text-soft)" }}>
              {column.taskCount}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--tint-text-muted)" }}>
            <span>Orden {column.order}</span>
            {column.wipLimit ? <span>WIP {column.wipLimit}</span> : <span>Sin limite</span>}
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onRename(column)}
              className="rounded-xl border px-2 py-1 text-[10px]"
              style={{ borderColor: "var(--tint-border)", color: "var(--tint-text-soft)", backgroundColor: "var(--tint-surface)" }}
            >
              Renombrar
            </button>
            <button
              onClick={() => onSetWipLimit(column)}
              className="rounded-xl border px-2 py-1 text-[10px]"
              style={{ borderColor: "var(--tint-border)", color: "var(--tint-text-soft)", backgroundColor: "var(--tint-surface)" }}
            >
              WIP
            </button>
            <button
              onClick={() => onReorder(column)}
              className="rounded-xl border px-2 py-1 text-[10px]"
              style={{ borderColor: "var(--tint-border)", color: "var(--tint-text-soft)", backgroundColor: "var(--tint-surface)" }}
            >
              Orden
            </button>
            <button
              onClick={() => onDelete(column)}
              className="rounded-xl border px-2 py-1 text-[10px]"
              style={{ borderColor: "rgba(211, 76, 82, 0.24)", backgroundColor: "var(--tint-surface)", color: "#ffd5d8" }}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {isAtLimit && (
        <div className="mb-3 rounded-xl border px-3 py-2 text-[11px]" style={{ borderColor: "rgba(239, 143, 0, 0.24)", backgroundColor: "var(--tint-surface)", color: "var(--tint-text)" }}>
          Limite WIP alcanzado
        </div>
      )}

      <div>
        {column.tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={onTaskClick}
            onDragStart={onTaskDragStart}
          />
        ))}
      </div>

      {!column.tasks.length && (
        <div className="mt-3 rounded-2xl border border-dashed px-4 py-6 text-center text-xs" style={{ borderColor: "var(--tint-border)", color: "var(--tint-text-muted)" }}>
          Suelta una tarea aqui o crea una nueva
        </div>
      )}

      {!readOnly && (
        <button
          onClick={() => onAddTask(column)}
          className="mt-3 w-full rounded-2xl border px-4 py-3 text-sm font-medium transition"
          style={{ borderColor: "var(--tint-border)", backgroundColor: "var(--tint-surface)", color: "var(--tint-text)" }}
        >
          + Agregar tarea
        </button>
      )}
    </div>
  );
}
