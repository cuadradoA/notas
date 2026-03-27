export default function ProjectDashboard({
  selectedProject,
  dashboardData,
  dashboardEntries,
  maxDashboardValue,
  onExportCsv,
  onExportPdf,
  ghostButtonStyle,
  primaryButtonStyle,
}) {
  if (!selectedProject || !dashboardData) {
    return null;
  }

  return (
    <section className="app-soft-panel mt-5 rounded-[28px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--app-text-muted)" }}>Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--app-text)" }}>Metricas del proyecto</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onExportCsv} className="rounded-2xl border px-4 py-3 text-sm" style={ghostButtonStyle}>Exportar CSV</button>
          <button onClick={onExportPdf} className="rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={primaryButtonStyle}>Exportar PDF</button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div className="rounded-[24px] p-4" style={{ backgroundColor: "var(--app-surface)" }}><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--app-text-muted)" }}>Total tareas</p><p className="mt-2 text-3xl font-semibold" style={{ color: "var(--app-text)" }}>{dashboardData.overview?.totalTasks || 0}</p></div>
        <div className="rounded-[24px] p-4" style={{ backgroundColor: "var(--app-surface)" }}><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--app-text-muted)" }}>Vencidas</p><p className="mt-2 text-3xl font-semibold" style={{ color: "var(--app-text)" }}>{dashboardData.overview?.overdueTasks || 0}</p></div>
        <div className="rounded-[24px] p-4" style={{ backgroundColor: "var(--app-surface)" }}><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--app-text-muted)" }}>Progreso</p><p className="mt-2 text-3xl font-semibold" style={{ color: "var(--app-text)" }}>{dashboardData.overview?.progress || 0}%</p></div>
        <div className="rounded-[24px] p-4" style={{ backgroundColor: "var(--app-surface)" }}><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--app-text-muted)" }}>Estado</p><p className="mt-2 text-xl font-semibold" style={{ color: "var(--app-text)" }}>{dashboardData.project?.status || selectedProject.status}</p></div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {[{ title: "Tareas por estado", items: dashboardEntries.tasksByStatus }, { title: "Tareas por usuario", items: dashboardEntries.tasksByUser }, { title: "Velocidad semanal", items: dashboardEntries.completedByWeek }].map((block) => (
          <div key={block.title} className="rounded-[24px] p-4" style={{ backgroundColor: "var(--app-surface)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>{block.title}</p>
            <div className="mt-4 grid gap-3">
              {block.items.length ? block.items.map(([label, value]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span style={{ color: "var(--app-text-soft)" }}>{label}</span>
                    <span style={{ color: "var(--app-text)" }}>{value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: "var(--app-shell)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${Math.max(8, (Number(value || 0) / maxDashboardValue) * 100)}%`, background: "linear-gradient(135deg, var(--app-primary), var(--app-accent))" }} />
                  </div>
                </div>
              )) : <p className="text-sm" style={{ color: "var(--app-text-soft)" }}>Sin datos todavia.</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
