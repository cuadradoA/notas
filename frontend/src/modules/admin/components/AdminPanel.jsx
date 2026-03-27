function formatDate(value) {
  if (!value) return "Sin registro";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPanel({
  open,
  data,
  busy,
  onClose,
  onRefresh,
  onExportCsv,
  onUpdateUser,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#05070d]/80 backdrop-blur-sm">
      <aside className="h-full w-full max-w-5xl overflow-y-auto border-l border-white/10 bg-[#0f111a] p-6 text-white shadow-[-24px_0_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Admin Console</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Auditoria y control</h2>
            <p className="mt-2 text-sm text-gray-400">Aqui administras usuarios, revisas historial y exportas reportes.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onRefresh} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">Refrescar</button>
            <button onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-gray-300">Cerrar</button>
          </div>
        </div>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Usuarios registrados</p>
            <span className="text-xs text-gray-500">{data?.users?.length || 0} usuarios</span>
          </div>
          <div className="mt-4 grid gap-3">
            {(data?.users || []).map((user) => (
              <div key={user._id} className="grid gap-3 rounded-2xl border border-white/10 p-4 md:grid-cols-[minmax(0,1fr)_160px_130px_auto] md:items-center">
                <div>
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  <p className="mt-1 text-xs text-gray-500">Ultimo acceso: {formatDate(user.lastLogin)}</p>
                </div>
                <select value={user.role} onChange={(event) => onUpdateUser(user._id, { role: event.target.value })} className="rounded-2xl border border-white/10 bg-[#090b12] px-4 py-3 text-sm text-white outline-none">
                  {["ADMIN", "PROJECT_MANAGER", "DEVELOPER"].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={user.isActive} onChange={(event) => onUpdateUser(user._id, { isActive: event.target.checked })} className="accent-violet-500" />
                  Activo
                </label>
                <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Proyectos activos</p>
            <span className="text-xs text-gray-500">{data?.activeProjects?.length || 0} proyectos</span>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {(data?.activeProjects || []).map((project) => (
              <div key={project._id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{project.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{project.status}</p>
                  </div>
                  <button onClick={() => onExportCsv(project)} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white">
                    CSV
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div>
                    <p className="text-xl font-semibold text-white">{project.progress}%</p>
                    <p className="text-xs text-gray-500">Progreso</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-white">{project.totalTasks}</p>
                    <p className="text-xs text-gray-500">Tareas</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-white">{project.overdueTasks}</p>
                    <p className="text-xs text-gray-500">Vencidas</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-white">{project.memberCount}</p>
                    <p className="text-xs text-gray-500">Miembros</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Historial global</p>
            <span className="text-xs text-gray-500">{busy ? "Actualizando..." : `${data?.recentAuditLogs?.length || 0} eventos`}</span>
          </div>
          <div className="mt-4 grid gap-3">
            {(data?.recentAuditLogs || []).map((log) => (
              <div key={log._id} className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-sm text-white">{log.action}</p>
                <p className="mt-1 text-xs text-gray-400">{log.actorId?.username || log.actorId?.email || "Sistema"}</p>
                <p className="mt-1 text-xs text-gray-500">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Tareas archivadas</p>
            <span className="text-xs text-gray-500">{data?.archivedTasks?.length || 0} tareas</span>
          </div>
          <div className="mt-4 grid gap-3">
            {(data?.archivedTasks || []).length ? (data.archivedTasks || []).map((task) => (
              <div key={task._id} className="rounded-2xl border border-white/10 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <p className="mt-1 text-xs text-gray-400">{task.projectName} • {task.boardName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{task.type}</p>
                    <p className="mt-1 text-xs text-gray-400">{task.priority}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Archivada: {formatDate(task.archivedAt)}</span>
                  <span>Completada: {formatDate(task.completedAt)}</span>
                  <span>Creada por: {task.createdBy?.username || task.createdBy?.email || "Sistema"}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-400">
                No hay tareas archivadas todavia.
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
