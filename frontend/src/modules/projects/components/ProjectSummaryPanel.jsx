export default function ProjectSummaryPanel({ projectStats }) {
  return (
    <section className="app-soft-panel rounded-[28px] p-5">
      <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--app-text-muted)" }}>Resumen</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
        {projectStats.map((item) => (
          <div key={item.label} className="rounded-[24px] px-4 py-4" style={{ backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "var(--app-text-muted)" }}>{item.label}</p>
            <p className="mt-2 break-words text-3xl font-semibold" style={{ color: "var(--app-text)" }}>{item.value}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--app-text-soft)" }}>{item.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
