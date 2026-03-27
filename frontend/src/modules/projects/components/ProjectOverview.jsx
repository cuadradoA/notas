const BOARD_TONES = ["var(--column-blue)", "var(--column-pink)", "var(--column-yellow)", "var(--column-mint)"];

export default function ProjectOverview({
  boards,
  selectedBoardId,
  selectedProject,
  onCreateBoard,
  onSelectBoard,
  ghostButtonStyle,
}) {
  return (
    <section className="app-soft-panel rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--app-text-muted)" }}>Recent Boards</p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--app-text)" }}>Tableros del proyecto</h2>
        </div>
        <button onClick={onCreateBoard} disabled={!selectedProject || selectedProject.status === "ARCHIVADO"} className="rounded-2xl border px-4 py-3 text-sm disabled:opacity-50" style={ghostButtonStyle}>+ Tablero</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {boards.length ? boards.map((board, index) => (
          <button key={board._id} onClick={() => onSelectBoard(board._id)} className="rounded-[26px] border p-5 text-left" style={{ borderColor: selectedBoardId === board._id ? "var(--app-primary)" : "var(--app-border)", backgroundColor: BOARD_TONES[index % BOARD_TONES.length] }}>
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "var(--tint-text-muted)" }}>Board</p>
            <h3 className="mt-6 text-xl font-semibold" style={{ color: "var(--tint-text)" }}>{board.name}</h3>
          </button>
        )) : (
          <div className="rounded-[26px] border border-dashed px-6 py-10 text-center text-sm" style={{ borderColor: "var(--app-border)", color: "var(--app-text-soft)" }}>
            No hay tableros disponibles.
          </div>
        )}
      </div>
    </section>
  );
}
