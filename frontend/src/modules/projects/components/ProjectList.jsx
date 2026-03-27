import { useMemo, useState } from "react";

const CARD_TONES = ["var(--column-blue)", "var(--column-pink)", "var(--column-yellow)", "var(--column-mint)"];

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ProjectList({ projects, selectedProjectId, onSelectProject, onCreateProject, loading }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const description = project.description || "";
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) || description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "TODOS" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [projects, search, statusFilter]);

  return (
    <aside className="app-soft-panel flex h-full flex-col rounded-[30px] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--app-text-muted)" }}>Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--app-text)" }}>My Projects</h2>
        </div>
        <button
          onClick={onCreateProject}
          className="rounded-2xl px-4 py-3 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-primary) 65%, var(--app-accent) 35%))" }}
        >
          + Nuevo
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proyectos..." className="app-input w-full rounded-2xl px-4 py-3 text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="app-input rounded-2xl px-4 py-3 text-sm">
          <option value="TODOS">Todos los estados</option>
          {["PLANIFICADO", "EN_PROGRESO", "PAUSADO", "COMPLETADO", "ARCHIVADO"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-1 app-scrollbar">
        {loading ? (
          <div className="app-panel rounded-[24px] px-5 py-8 text-center text-sm" style={{ color: "var(--app-text-soft)" }}>
            Cargando proyectos...
          </div>
        ) : null}

        {!loading && !filteredProjects.length ? (
          <div className="rounded-[24px] border border-dashed px-5 py-8 text-center text-sm" style={{ borderColor: "var(--app-border)", color: "var(--app-text-soft)" }}>
            No hay proyectos que coincidan con tu busqueda.
          </div>
        ) : null}

        <div className="grid gap-3">
          {filteredProjects.map((project, index) => (
            <button
              key={project._id}
              onClick={() => onSelectProject(project._id)}
              className="rounded-[26px] border p-4 text-left transition"
              style={{
                borderColor: selectedProjectId === project._id ? "var(--app-primary)" : "var(--app-border)",
                backgroundColor: selectedProjectId === project._id ? "color-mix(in srgb, var(--app-primary) 10%, var(--app-surface))" : "var(--app-surface)",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 inline-flex h-12 w-12 shrink-0 rounded-[18px]"
                  style={{ backgroundColor: CARD_TONES[index % CARD_TONES.length] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-base font-semibold" style={{ color: "var(--app-text)" }}>{project.name}</h3>
                    <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: "var(--app-shell)", color: "var(--app-text-soft)" }}>
                      {project.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6" style={{ color: "var(--app-text-soft)" }}>
                    {project.description || "Sin descripcion"}
                  </p>
                  <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: "var(--app-shell)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${project.progress}%`, backgroundColor: CARD_TONES[index % CARD_TONES.length] }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "var(--app-text-muted)" }}>
                    <span>{formatDate(project.startDate)}</span>
                    <span>{project.progress}%</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
