function escapeCsv(value) {
  const normalized = String(value ?? "");
  return `"${normalized.replace(/"/g, '""')}"`;
}

class CsvProjectReportRenderer {
  render(viewModel) {
    const lines = [
      ["title", "type", "priority", "status", "dueDate", "estimatedHours", "spentHours", "assignees"].join(","),
      ...viewModel.tasks.map((task) => [
        escapeCsv(task.title),
        task.type || "",
        task.priority || "",
        escapeCsv(task.statusLabel),
        task.dueDate ? new Date(task.dueDate).toISOString() : "",
        task.estimatedHours || 0,
        task.spentHours || 0,
        escapeCsv((task.assignees || []).join(" | "))
      ].join(","))
    ];

    return lines.join("\n");
  }
}

module.exports = CsvProjectReportRenderer;
