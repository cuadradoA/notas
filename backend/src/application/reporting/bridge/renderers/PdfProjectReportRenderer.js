function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

class PdfProjectReportRenderer {
  render(viewModel) {
    const lines = [
      `Reporte del proyecto: ${viewModel.project.name}`,
      `Estado: ${viewModel.project.status}`,
      `Total tareas: ${viewModel.overview.totalTasks}`,
      `Tareas vencidas: ${viewModel.overview.overdueTasks}`,
      `Progreso general: ${viewModel.overview.progress}%`,
      "",
      "Tareas por estado:",
      ...Object.entries(viewModel.tasksByStatus).map(([label, value]) => `- ${label}: ${value}`),
      "",
      "Tareas por usuario:",
      ...Object.entries(viewModel.tasksByUser).map(([label, value]) => `- ${label}: ${value}`),
      "",
      "Velocidad por semana:",
      ...Object.entries(viewModel.completedByWeek).map(([label, value]) => `- ${label}: ${value}`)
    ];
    const content = [
      "BT",
      "/F1 16 Tf",
      "50 780 Td",
      ...lines.flatMap((line, index) => (
        index === 0
          ? [`(${escapePdfText(line)}) Tj`]
          : ["0 -18 Td", `(${escapePdfText(line)}) Tj`]
      )),
      "ET"
    ].join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
      `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(pdf, "utf8"));
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const startXref = Buffer.byteLength(pdf, "utf8");
    pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}
trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${startXref}
%%EOF`;

    return Buffer.from(pdf, "utf8");
  }
}

module.exports = PdfProjectReportRenderer;
