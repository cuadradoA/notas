const PROJECT_STATUSES = Object.freeze({
  PLANIFICADO: "PLANIFICADO",
  EN_PROGRESO: "EN_PROGRESO",
  PAUSADO: "PAUSADO",
  COMPLETADO: "COMPLETADO",
  ARCHIVADO: "ARCHIVADO"
});

const allowedTransitions = Object.freeze({
  PLANIFICADO: ["EN_PROGRESO", "PAUSADO"],
  EN_PROGRESO: ["PAUSADO", "COMPLETADO"],
  PAUSADO: ["PLANIFICADO", "EN_PROGRESO", "COMPLETADO"],
  COMPLETADO: ["ARCHIVADO"],
  ARCHIVADO: []
});

class ProjectStatus {
  static values() {
    return Object.values(PROJECT_STATUSES);
  }

  static ensureValid(status) {
    if (!ProjectStatus.values().includes(status)) {
      throw new Error("Invalid project status");
    }

    return status;
  }

  static canTransition(currentStatus, nextStatus) {
    ProjectStatus.ensureValid(currentStatus);
    ProjectStatus.ensureValid(nextStatus);
    return allowedTransitions[currentStatus].includes(nextStatus);
  }

  static ensureTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
      return nextStatus;
    }

    if (!ProjectStatus.canTransition(currentStatus, nextStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}`);
    }

    return nextStatus;
  }

  static isReadOnly(status) {
    return status === PROJECT_STATUSES.ARCHIVADO;
  }
}

module.exports = {
  ProjectStatus,
  PROJECT_STATUSES
};
