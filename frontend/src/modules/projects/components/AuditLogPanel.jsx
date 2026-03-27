function formatDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AuditLogPanel({ logs = [] }) {
  return (
    <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Auditoria reciente</p>
        <span className="text-xs text-gray-500">{logs.length} eventos</span>
      </div>
      <div className="mt-4 grid gap-3">
        {logs.length ? logs.map((log) => (
          <div key={log._id} className="rounded-2xl border border-white/10 px-4 py-3">
            <p className="text-sm text-white">{log.action}</p>
            <p className="mt-1 text-xs text-gray-400">{log.actorId?.username || log.actorId?.email || "Sistema"}</p>
            <p className="mt-1 text-xs text-gray-500">{formatDate(log.createdAt)}</p>
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-500">
            Sin auditoria todavia.
          </div>
        )}
      </div>
    </section>
  );
}
