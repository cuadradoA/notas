const ProjectReportBridge = require("./ProjectReportBridge");

class StandardProjectReport extends ProjectReportBridge {
  buildViewModel(snapshot) {
    return {
      project: snapshot.project,
      overview: snapshot.overview,
      tasksByStatus: snapshot.tasksByStatus,
      tasksByUser: snapshot.tasksByUser,
      completedByWeek: snapshot.completedByWeek,
      tasks: snapshot.tasks,
      structure: snapshot.structure
    };
  }
}

module.exports = StandardProjectReport;
