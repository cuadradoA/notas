import NotificationBell from "../../notifications/components/NotificationBell";

export default function ProjectHeaderBar({
  selectedProject,
  user,
  taskSearch,
  onTaskSearchChange,
  onOpenProfile,
  onToggleTheme,
  onOpenAdmin,
  onLogout,
  isAdmin,
  themeLabel,
  ghostButtonStyle,
}) {
  return (
    <header className="app-soft-panel rounded-[28px] p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "var(--app-text-muted)" }}>My Notes</p>
          <h1 className="mt-2 text-3xl font-semibold" style={{ color: "var(--app-text)" }}>{selectedProject?.name || `Buenos dias, ${user?.username || user?.email || "equipo"}`}</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--app-text-soft)" }}>{!selectedProject ? "Selecciona un proyecto para ver tableros, tareas y acciones rapidas." : selectedProject.description || "Gestiona tableros, columnas y tareas con un tablero visual unificado."}</p>
        </div>
        <div className="flex flex-wrap items-stretch justify-start gap-3 xl:justify-end">
          <div className="flex w-full min-w-0 sm:min-w-[260px] xl:w-[280px] items-center rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--app-surface)" }}>
            <input value={taskSearch} onChange={(e) => onTaskSearchChange(e.target.value)} placeholder="Buscar tareas o texto..." className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--app-text)" }} />
          </div>
          <NotificationBell />
          <button onClick={onOpenProfile} className="rounded-2xl border px-4 py-3 text-sm" style={ghostButtonStyle}>Perfil</button>
          <button onClick={onToggleTheme} className="rounded-2xl border px-4 py-3 text-sm" style={ghostButtonStyle}>{themeLabel}</button>
          {isAdmin ? <button onClick={onOpenAdmin} className="rounded-2xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "var(--app-primary-soft)", color: "var(--app-primary)" }}>Auditoria</button> : null}
          <button onClick={onLogout} className="rounded-2xl border px-4 py-3 text-sm" style={{ ...ghostButtonStyle, color: "var(--app-text-soft)" }}>Cerrar sesion</button>
        </div>
      </div>
    </header>
  );
}
