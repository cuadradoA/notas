import { useEffect, useMemo, useState } from "react";

const PRIORITIES = ["BAJA", "MEDIA", "ALTA", "URGENTE"];
const TYPES = ["TASK", "FEATURE", "BUG", "IMPROVEMENT"];

function normalizeLabelName(value) {
  return value.trim();
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

export default function TaskModal({ open, column, boardId, onClose, onSubmit, busy, projectMembers = [] }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIA",
    type: "TASK",
    dueDate: "",
    estimatedHours: "",
    labels: [],
    labelName: "",
    labelColor: "#6366f1",
    assignees: [],
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        description: "",
        priority: "MEDIA",
        type: "TASK",
        dueDate: "",
        estimatedHours: "",
        labels: [],
        labelName: "",
        labelColor: "#6366f1",
        assignees: [],
      });
    }
  }, [open]);

  const errors = useMemo(() => {
    const next = {};

    if (!form.title.trim()) next.title = "El titulo es obligatorio";
    if (!form.assignees.length) next.assignees = "Debes asignar al menos un responsable";
    if (form.dueDate && Number.isNaN(new Date(form.dueDate).getTime())) {
      next.dueDate = "Fecha invalida";
    }
    if (form.estimatedHours !== "" && Number(form.estimatedHours) < 0) {
      next.estimatedHours = "La estimacion no puede ser negativa";
    }

    return next;
  }, [form]);

  if (!open || !column) return null;

  const hasErrors = Object.keys(errors).length > 0;

  const addLabel = () => {
    const normalizedName = normalizeLabelName(form.labelName);

    if (!normalizedName) {
      return;
    }

    const alreadyExists = form.labels.some(
      (label) => label.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (alreadyExists) {
      setForm((prev) => ({
        ...prev,
        labelName: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      labels: [...prev.labels, { name: normalizedName, color: prev.labelColor }],
      labelName: "",
    }));
  };

  const toggleAssignee = (assigneeId) => {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(assigneeId)
        ? prev.assignees.filter((id) => id !== assigneeId)
        : [...prev.assignees, assigneeId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#11131d] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Nueva tarea</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Crear tarea en {column.name}</h2>
            <p className="mt-2 text-sm text-gray-400">Configura prioridad, tipo, responsables y etiquetas desde un flujo unico.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-300">Cerrar</button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">Titulo</span>
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b0d14] px-4 py-3 text-white outline-none focus:border-violet-400" placeholder="Implementar onboarding Kanban" />
              {errors.title && <span className="mt-2 block text-xs text-rose-300">{errors.title}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">Descripcion</span>
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={5} className="w-full rounded-2xl border border-white/10 bg-[#0b0d14] px-4 py-3 text-white outline-none focus:border-violet-400" placeholder="Describe el objetivo, contexto y criterios de terminado" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">Tipo</span>
                <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b0d14] px-4 py-3 text-white outline-none focus:border-violet-400">
                  {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">Prioridad</span>
                <select value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b0d14] px-4 py-3 text-white outline-none focus:border-violet-400">
                  {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">Fecha limite</span>
                <input type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b0d14] px-4 py-3 text-white outline-none focus:border-violet-400" />
                {errors.dueDate && <span className="mt-2 block text-xs text-rose-300">{errors.dueDate}</span>}
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">Estimacion (horas)</span>
                <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => setForm((prev) => ({ ...prev, estimatedHours: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#0b0d14] px-4 py-3 text-white outline-none focus:border-violet-400" placeholder="8" />
                {errors.estimatedHours && <span className="mt-2 block text-xs text-rose-300">{errors.estimatedHours}</span>}
              </label>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-[#0b0d14] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Labels</p>
              <div className="mt-3 flex gap-2">
                <input value={form.labelName} onChange={(e) => setForm((prev) => ({ ...prev, labelName: e.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLabel(); } }} placeholder="API" className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
                <input type="color" value={form.labelColor} onChange={(e) => setForm((prev) => ({ ...prev, labelColor: e.target.value }))} className="h-11 w-14 rounded-2xl border border-white/10 bg-transparent p-1" />
                <button onClick={addLabel} type="button" className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-white">Agregar</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.labels.map((label, index) => (
                  <button
                    key={`${label.name}-${index}`}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, labels: prev.labels.filter((_, currentIndex) => currentIndex !== index) }))}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
                    style={{ backgroundColor: label.color, color: getLabelTextColor(label.color), borderColor: "rgba(255,255,255,0.18)" }}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: getLabelTextColor(label.color) === "#ffffff" ? "rgba(255,255,255,0.9)" : "rgba(17,24,39,0.9)" }} />
                    {label.name}
                  </button>
                ))}
              </div>
              {!form.labels.length ? <p className="mt-3 text-xs text-gray-500">Agrega uno o varios labels y se reflejaran en la tarjeta de la tarea.</p> : null}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#0b0d14] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Responsables</p>
              <div className="mt-3 grid gap-2">
                {projectMembers.length ? projectMembers.map((member) => (
                  <label key={member._id} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2 text-sm text-gray-200">
                    <div>
                      <p>{member.username || member.email}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <input type="checkbox" checked={form.assignees.includes(member._id)} onChange={() => toggleAssignee(member._id)} className="h-4 w-4 accent-violet-500" />
                  </label>
                )) : (
                  <p className="text-sm text-gray-500">No hay miembros disponibles todavia.</p>
                )}
              </div>
              {errors.assignees ? <span className="mt-3 block text-xs text-rose-300">{errors.assignees}</span> : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-gray-300">Cancelar</button>
          <button
            onClick={() => onSubmit({
              title: form.title.trim(),
              description: form.description.trim(),
              priority: form.priority,
              type: form.type,
              dueDate: form.dueDate || undefined,
              estimatedHours: form.estimatedHours === "" ? 0 : Number(form.estimatedHours),
              labels: form.labels,
              assignees: form.assignees,
              boardId,
              columnId: column._id,
            }, errors)}
            disabled={busy || hasErrors}
            className="rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {busy ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
