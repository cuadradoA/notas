import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPanel from "../../admin/components/AdminPanel";
import Column from "../../kanban/components/Column";
import TaskDetailModal from "../../kanban/components/TaskDetailModal";
import TaskModal from "../../kanban/components/TaskModal";
import ProjectDashboard from "../components/ProjectDashboard";
import ProjectHeaderBar from "../components/ProjectHeaderBar";
import ProjectList from "../components/ProjectList";
import ProjectOverview from "../components/ProjectOverview";
import ProjectSummaryPanel from "../components/ProjectSummaryPanel";
import { useProjects } from "../context/ProjectContext";
import { useTheme } from "../../../theme/ThemeContext";
import {
  addAttachment,
  addComment,
  addSubtask,
  addTimeLog,
  archiveProject,
  changeProjectStatus,
  cloneProject,
  cloneTask,
  createBoard,
  createColumn,
  createProject,
  createTask,
  deleteColumn,
  deleteComment,
  deleteMyFilter,
  deleteProject,
  deleteTask,
  exportProjectCsv,
  exportProjectPdf,
  getAdminOverview,
  getBoardById,
  getBoardsByProject,
  getMyProfile,
  getMySettings,
  getProjectDashboard,
  getTaskById,
  inviteProjectMember,
  moveTask,
  saveMyFilter,
  searchBoardTasks,
  undoTask,
  updateAdminUser,
  updateColumn,
  updateComment,
  updateMyProfile,
  updateProject,
  updateSubtask,
  updateTaskAssignees,
} from "../../kanban/services/kanban.service";

const STATUS_OPTIONS = [
  "PLANIFICADO",
  "EN_PROGRESO",
  "PAUSADO",
  "COMPLETADO",
  "ARCHIVADO",
];

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function FormPanel({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/80 p-4 backdrop-blur-sm">
      <div className="app-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-4">
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--app-text)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-sm"
            style={{
              borderColor: "var(--app-border)",
              color: "var(--app-text-soft)",
            }}
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function ghostStyle() {
  return { borderColor: "var(--app-border)", color: "var(--app-text)" };
}

function primaryStyle(extra = {}) {
  return {
    background:
      "linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-primary) 70%, var(--app-accent) 30%))",
    ...extra,
  };
}

export default function ProjectsPage({ user, onLogout, onUserUpdate }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, loading, error, setError, refreshProjects } = useProjects();
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [boardDetail, setBoardDetail] = useState(null);
  const [panel, setPanel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [taskModal, setTaskModal] = useState({ open: false, column: null });
  const [taskDetail, setTaskDetail] = useState({ open: false, task: null });
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [taskFilters, setTaskFilters] = useState({
    search: "",
    priority: "",
    type: "",
    assignee: "",
    label: "",
    dateFrom: "",
    dateTo: "",
  });
  const [form, setForm] = useState({});
  const [savedFilterName, setSavedFilterName] = useState("");
  const currentUserId = user?.id || user?._id || null;
  const isAdmin = user?.role === "ADMIN";
  const selectedProject = useMemo(
    () => projects.find((project) => project._id === projectId) || null,
    [projects, projectId],
  );
  const selectedProjectMembers = selectedProject?.members || [];
  const savedBoardFilters =
    settings?.savedFilters?.filter(
      (filter) =>
        filter.scope === "BOARD" &&
        (!filter.projectId || filter.projectId === selectedProject?._id),
    ) || [];
  const archivedTasks = boardDetail?.archivedTasks || [];
  const dashboardEntries = useMemo(
    () => ({
      tasksByStatus: Object.entries(dashboardData?.tasksByStatus || {}),
      tasksByUser: Object.entries(dashboardData?.tasksByUser || {}),
      completedByWeek: Object.entries(dashboardData?.completedByWeek || {}),
    }),
    [dashboardData],
  );
  const maxDashboardValue = useMemo(
    () =>
      Math.max(
        1,
        ...dashboardEntries.tasksByStatus.map(([, value]) => value),
        ...dashboardEntries.tasksByUser.map(([, value]) => value),
        ...dashboardEntries.completedByWeek.map(([, value]) => value),
      ),
    [dashboardEntries],
  );

  const selectedBoardProgress = useMemo(() => {
    if (!boardDetail?.columns?.length) return null;
    const normalized = boardDetail.columns.map((column) => ({
      ...column,
      normalizedName: (column.name || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    }));
    const total = normalized.reduce(
      (sum, column) => sum + (column.tasks?.length || 0),
      0,
    );
    const done = normalized
      .filter(
        (column) =>
          column.normalizedName.includes("complet") ||
          column.normalizedName.includes("done"),
      )
      .reduce((sum, column) => sum + (column.tasks?.length || 0), 0);
    return total ? Math.round((done / total) * 100) : 0;
  }, [boardDetail]);

  const resolvedProjectProgress =
    selectedBoardProgress ?? selectedProject?.progress ?? 0;
  const projectStats = useMemo(() => {
    if (selectedProject && dashboardData) {
      return [
        {
          label: "Total tareas",
          value: dashboardData.overview?.totalTasks || 0,
          helper: "Carga total del proyecto",
        },
        {
          label: "Tareas vencidas",
          value: dashboardData.overview?.overdueTasks || 0,
          helper: "Pendientes fuera de fecha",
        },
        {
          label: "Progreso",
          value: `${dashboardData.overview?.progress || 0}%`,
          helper:
            dashboardData.project?.status
              ?.toLowerCase()
              ?.replaceAll("_", " ") || "Sin estado",
        },
        {
          label: "Estado",
          value: dashboardData.project?.status || selectedProject.status,
          helper: `${Object.keys(dashboardData.tasksByStatus || {}).length} estados activos`,
        },
      ];
    }

    return [
      {
        label: "Proyectos activos",
        value: projects.filter((project) => project.status !== "ARCHIVADO")
          .length,
        helper: `${projects.length} en total`,
      },
      {
        label: "Progreso",
        value: `${resolvedProjectProgress}%`,
        helper: selectedProject
          ? selectedProject.status.toLowerCase().replaceAll("_", " ")
          : "Selecciona un proyecto",
      },
      {
        label: "Tableros",
        value: boards.length,
        helper: selectedProject
          ? "Estructura Kanban disponible"
          : "Sin proyecto seleccionado",
      },
      {
        label: "Tareas visibles",
        value:
          boardDetail?.columns?.reduce(
            (sum, column) => sum + column.taskCount,
            0,
          ) || 0,
        helper: "Vista actual del tablero",
      },
    ];
  }, [
    boardDetail,
    boards.length,
    dashboardData,
    projects,
    resolvedProjectProgress,
    selectedProject,
  ]);

  const loadBoards = async (
    projectRefId = selectedProject?._id,
    nextBoardId = null,
  ) => {
    if (!projectRefId) return;
    const boardList = await getBoardsByProject(projectRefId);
    setBoards(boardList);
    const requestedBoardId = nextBoardId || selectedBoardId;
    const boardExists = boardList.some(
      (board) => board._id === requestedBoardId,
    );
    const effectiveBoardId = boardExists
      ? requestedBoardId
      : boardList[0]?._id || null;
    setSelectedBoardId(effectiveBoardId);
    setBoardDetail(
      effectiveBoardId ? await getBoardById(effectiveBoardId) : null,
    );
  };

  const loadProjectDashboard = async (projectRefId = selectedProject?._id) => {
    if (!projectRefId) {
      setDashboardData(null);
      return;
    }

    try {
      setDashboardData(await getProjectDashboard(projectRefId));
    } catch (err) {
      console.error(err);
      setDashboardData(null);
    }
  };

  useEffect(() => {
    Promise.all([
      getMySettings().then(setSettings),
      getMyProfile().catch(() => user),
    ]).catch(() => {});
  }, []);
  useEffect(() => {
    if (selectedProject?._id) {
      setSelectedBoardId(null);
      setBoardDetail(null);
      Promise.all([
        loadBoards().catch((err) =>
          setError(
            err.response?.data?.error || "No se pudieron cargar los tableros",
          ),
        ),
        loadProjectDashboard().catch(() => {}),
      ]).catch(() => {});
    } else {
      setBoards([]);
      setSelectedBoardId(null);
      setBoardDetail(null);
      setDashboardData(null);
    }
  }, [selectedProject?._id]);
  useEffect(() => {
    if (!loading && projectId && !selectedProject)
      navigate("/projects", { replace: true });
  }, [loading, navigate, projectId, selectedProject]);

  const openPanel = (type, payload = {}) => {
    setPanel(type);
    setForm(payload);
    setSuccessMessage("");
  };
  const runAction = async (
    action,
    fallbackError,
    successText = "",
    options = {},
  ) => {
    const { refreshBoards = true } = options;
    setBusy(true);
    setError("");
    setSuccessMessage("");
    try {
      await action();
      await refreshProjects();
      if (refreshBoards && selectedProject?._id) {
        await loadBoards(selectedProject._id);
        await loadProjectDashboard(selectedProject._id);
      }
      if (successText) setSuccessMessage(successText);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || fallbackError);
    } finally {
      setBusy(false);
    }
  };

  const refreshCurrentBoard = async (boardId = selectedBoardId) => {
    if (selectedProject?._id) await loadBoards(selectedProject._id, boardId);
  };
  const applySavedFilter = async (filter) => {
    const criteria = filter?.criteria || {};
    setTaskFilters({
      search: criteria.search || "",
      priority: criteria.priority || "",
      type: criteria.type || "",
      assignee: criteria.assignee || "",
      label: criteria.label || "",
      dateFrom: criteria.dateFrom || "",
      dateTo: criteria.dateTo || "",
    });
    setBusy(true);
    setError("");
    try {
      const filteredTasks = await searchBoardTasks(selectedBoardId, criteria);
      const grouped = filteredTasks.reduce((acc, task) => {
        acc[task.columnId] = [...(acc[task.columnId] || []), task];
        return acc;
      }, {});
      setBoardDetail((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((column) => ({
                ...column,
                tasks: grouped[column._id] || [],
                taskCount: (grouped[column._id] || []).length,
              })),
            }
          : prev,
      );
    } catch (err) {
      setError(
        err.response?.data?.error || "No se pudo aplicar el filtro guardado",
      );
    } finally {
      setBusy(false);
    }
  };
  const loadAdminPanel = async () =>
    runAction(
      async () => {
        setAdminData(await getAdminOverview());
        setAdminPanelOpen(true);
      },
      "No se pudo cargar la consola administrativa",
      "",
      { refreshBoards: false },
    );
  const openTaskDetail = async (task) =>
    runAction(
      async () =>
        setTaskDetail({ open: true, task: await getTaskById(task._id) }),
      "No se pudo cargar la tarea",
      "",
      { refreshBoards: false },
    );
  const syncTaskDetail = async (taskId) =>
    setTaskDetail({ open: true, task: await getTaskById(taskId) });
  const handleTaskAction = async (action, fallbackError, successText = "") => {
    let result = null;
    await runAction(
      async () => {
        result = await action();
        await refreshCurrentBoard();
      },
      fallbackError,
      successText,
    );
    if (result?._id) await syncTaskDetail(result._id);
  };
  const handleTaskDrop = (event, targetColumn) => {
    if (selectedProject?.status === "ARCHIVADO") return;
    const taskId = event.dataTransfer.getData("text/task-id");
    const sourceColumnId = event.dataTransfer.getData("text/task-column-id");
    if (!taskId || sourceColumnId === targetColumn._id) return;
    runAction(
      async () => {
        const moved = await moveTask(taskId, targetColumn._id);
        if (taskDetail.task?._id === taskId)
          setTaskDetail({ open: true, task: moved });
      },
      "No se pudo mover la tarea",
      "Tarea movida correctamente",
    );
  };
  const applyTaskFilters = async () => {
    if (!selectedBoardId) return;
    setBusy(true);
    setError("");
    try {
      const filteredTasks = await searchBoardTasks(
        selectedBoardId,
        taskFilters,
      );
      const grouped = filteredTasks.reduce((acc, task) => {
        acc[task.columnId] = [...(acc[task.columnId] || []), task];
        return acc;
      }, {});
      setBoardDetail((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((column) => ({
                ...column,
                tasks: grouped[column._id] || [],
                taskCount: (grouped[column._id] || []).length,
              })),
            }
          : prev,
      );
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "No se pudieron aplicar los filtros",
      );
    } finally {
      setBusy(false);
    }
  };
  const clearTaskFilters = async () => {
    setTaskFilters({
      search: "",
      priority: "",
      type: "",
      assignee: "",
      label: "",
      dateFrom: "",
      dateTo: "",
    });
    await refreshCurrentBoard();
  };
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1720px]">
        <div className="app-panel rounded-[36px] p-4 md:p-6">
          <div className="grid gap-6 xl:gap-24 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="grid gap-6">
              <ProjectList
                loading={loading}
                projects={projects}
                selectedProjectId={selectedProject?._id}
                onSelectProject={(id) => navigate(`/projects/${id}`)}
                onCreateProject={() =>
                  openPanel("project-create", {
                    name: "",
                    description: "",
                    startDate: new Date().toISOString().slice(0, 10),
                    estimatedEndDate: new Date().toISOString().slice(0, 10),
                  })
                }
              />
            </div>
            <main
              className="rounded-[32px] p-4 md:p-5 xl:pl-12"
              style={{ backgroundColor: "var(--app-shell-strong)" }}
            >
              <ProjectHeaderBar
                selectedProject={selectedProject}
                user={user}
                taskSearch={taskFilters.search}
                onTaskSearchChange={(value) =>
                  setTaskFilters((prev) => ({ ...prev, search: value }))
                }
                onOpenProfile={() =>
                  openPanel("profile", {
                    username: user?.username || "",
                    avatar: user?.avatar || "",
                    description: user?.description || "",
                  })
                }
                onToggleTheme={toggleTheme}
                onOpenAdmin={loadAdminPanel}
                onLogout={onLogout}
                isAdmin={isAdmin}
                themeLabel={theme.label}
                ghostButtonStyle={ghostStyle()}
              />

              <div className="mt-5 grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
                <ProjectOverview
                  boards={boards}
                  selectedBoardId={selectedBoardId}
                  selectedProject={selectedProject}
                  onCreateBoard={() => openPanel("board", { name: "" })}
                  onSelectBoard={refreshCurrentBoard}
                  ghostButtonStyle={ghostStyle()}
                />
                <ProjectSummaryPanel projectStats={projectStats} />
              </div>

              <ProjectDashboard
                selectedProject={selectedProject}
                dashboardData={dashboardData}
                dashboardEntries={dashboardEntries}
                maxDashboardValue={maxDashboardValue}
                onExportCsv={async () =>
                  downloadBlob(
                    await exportProjectCsv(selectedProject._id),
                    `${selectedProject.name}-reporte.csv`,
                  )
                }
                onExportPdf={async () =>
                  downloadBlob(
                    await exportProjectPdf(selectedProject._id),
                    `${selectedProject.name}-reporte.pdf`,
                  )
                }
                ghostButtonStyle={ghostStyle()}
                primaryButtonStyle={primaryStyle()}
              />

              {selectedProject ? (
                <div className="app-soft-panel mt-5 rounded-[28px] p-5">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        openPanel("project-edit", {
                          ...selectedProject,
                          startDate: selectedProject.startDate?.slice(0, 10),
                          estimatedEndDate:
                            selectedProject.estimatedEndDate?.slice(0, 10),
                        })
                      }
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={ghostStyle()}
                    >
                      Editar proyecto
                    </button>
                    <button
                      onClick={() =>
                        openPanel("project-clone", {
                          name: `${selectedProject.name} copia`,
                          description: selectedProject.description || "",
                          startDate: new Date().toISOString().slice(0, 10),
                          estimatedEndDate:
                            selectedProject.estimatedEndDate?.slice(0, 10) ||
                            new Date().toISOString().slice(0, 10),
                        })
                      }
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={ghostStyle()}
                    >
                      Clonar
                    </button>
                    <button
                      onClick={() => openPanel("invite", { email: "" })}
                      className="rounded-2xl px-4 py-3 text-sm"
                      style={{
                        backgroundColor: "var(--app-primary-soft)",
                        color: "var(--app-primary)",
                      }}
                    >
                      Invitar
                    </button>
                    <button
                      onClick={() => openPanel("board", { name: "" })}
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={ghostStyle()}
                    >
                      + Tablero
                    </button>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <select
                      value={selectedProject.status}
                      onChange={(e) =>
                        runAction(
                          async () => {
                            await changeProjectStatus(
                              selectedProject._id,
                              e.target.value,
                            );
                          },
                          "No se pudo actualizar el estado",
                          "Estado actualizado correctamente",
                        )
                      }
                      disabled={busy || selectedProject.status === "ARCHIVADO"}
                      className="app-input rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        openPanel("column", {
                          name: "",
                          order: (boardDetail?.columns?.length || 0) + 1,
                          wipLimit: "",
                        })
                      }
                      disabled={
                        !boardDetail || selectedProject.status === "ARCHIVADO"
                      }
                      className="rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      style={primaryStyle({
                        background:
                          "linear-gradient(135deg, var(--app-primary), var(--app-success))",
                      })}
                    >
                      + Columna
                    </button>
                    <button
                      onClick={() => openPanel("archive")}
                      disabled={selectedProject.status !== "COMPLETADO"}
                      className="rounded-2xl px-4 py-3 text-sm disabled:opacity-50"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--app-accent) 16%, transparent)",
                        color: "#8a5b00",
                      }}
                    >
                      Archivar
                    </button>
                    <button
                      onClick={() => openPanel("delete-project")}
                      className="rounded-2xl px-4 py-3 text-sm"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--app-danger) 14%, transparent)",
                        color: "var(--app-danger)",
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="mt-6 grid gap-4 2xl:grid-cols-[1.25fr_0.75fr]">
                    <div
                      className="rounded-[24px] p-4"
                      style={{ backgroundColor: "var(--app-surface)" }}
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                        <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                          <input
                            value={taskFilters.search}
                            onChange={(e) =>
                              setTaskFilters((prev) => ({
                                ...prev,
                                search: e.target.value,
                              }))
                            }
                            placeholder="Texto libre"
                            className="app-input rounded-2xl px-4 py-3 text-sm"
                          />
                          <select
                            value={taskFilters.assignee}
                            onChange={(e) =>
                              setTaskFilters((prev) => ({
                                ...prev,
                                assignee: e.target.value,
                              }))
                            }
                            className="app-input rounded-2xl px-4 py-3 text-sm"
                          >
                            <option value="">Responsable</option>
                            {selectedProjectMembers.map((member) => (
                              <option key={member._id} value={member._id}>
                                {member.username || member.email}
                              </option>
                            ))}
                          </select>
                          <input
                            value={taskFilters.label}
                            onChange={(e) =>
                              setTaskFilters((prev) => ({
                                ...prev,
                                label: e.target.value,
                              }))
                            }
                            placeholder="Etiqueta"
                            className="app-input rounded-2xl px-4 py-3 text-sm"
                          />
                          <select
                            value={taskFilters.priority}
                            onChange={(e) =>
                              setTaskFilters((prev) => ({
                                ...prev,
                                priority: e.target.value,
                              }))
                            }
                            className="app-input rounded-2xl px-4 py-3 text-sm"
                          >
                            <option value="">Prioridad</option>
                            {["BAJA", "MEDIA", "ALTA", "CRITICA"].map(
                              (priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ),
                            )}
                          </select>
                          <select
                            value={taskFilters.type}
                            onChange={(e) =>
                              setTaskFilters((prev) => ({
                                ...prev,
                                type: e.target.value,
                              }))
                            }
                            className="app-input rounded-2xl px-4 py-3 text-sm"
                          >
                            <option value="">Tipo</option>
                            {["FEATURE", "BUG", "TASK", "IMPROVEMENT"].map(
                              (type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ),
                            )}
                          </select>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="date"
                              value={taskFilters.dateFrom}
                              onChange={(e) =>
                                setTaskFilters((prev) => ({
                                  ...prev,
                                  dateFrom: e.target.value,
                                }))
                              }
                              className="app-input rounded-2xl px-4 py-3 text-sm"
                            />
                            <input
                              type="date"
                              value={taskFilters.dateTo}
                              onChange={(e) =>
                                setTaskFilters((prev) => ({
                                  ...prev,
                                  dateTo: e.target.value,
                                }))
                              }
                              className="app-input rounded-2xl px-4 py-3 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 xl:justify-end">
                          <button
                            onClick={applyTaskFilters}
                            className="rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                            style={primaryStyle()}
                          >
                            Filtrar
                          </button>
                          <button
                            onClick={clearTaskFilters}
                            className="rounded-2xl border px-4 py-3 text-sm"
                            style={ghostStyle()}
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <input
                          value={savedFilterName}
                          onChange={(e) => setSavedFilterName(e.target.value)}
                          placeholder="Nombre del filtro"
                          className="app-input rounded-2xl px-4 py-3 text-sm"
                        />
                        <button
                          onClick={() =>
                            runAction(
                              async () => {
                                const nextSettings = await saveMyFilter({
                                  name:
                                    savedFilterName ||
                                    `Filtro ${savedBoardFilters.length + 1}`,
                                  scope: "BOARD",
                                  projectId: selectedProject._id,
                                  criteria: taskFilters,
                                });
                                setSettings(nextSettings);
                                setSavedFilterName("");
                              },
                              "No se pudo guardar el filtro",
                              "Filtro guardado correctamente",
                              { refreshBoards: false },
                            )
                          }
                          className="rounded-2xl border px-4 py-3 text-sm"
                          style={ghostStyle()}
                        >
                          Guardar filtro
                        </button>
                      </div>
                    </div>
                    <div
                      className="rounded-[24px] p-4"
                      style={{ backgroundColor: "var(--app-surface)" }}
                    >
                      <p
                        className="text-xs uppercase tracking-[0.22em]"
                        style={{ color: "var(--app-text-muted)" }}
                      >
                        Filtros guardados
                      </p>
                      <div className="mt-4 grid gap-3">
                        {savedBoardFilters.length ? (
                          savedBoardFilters.map((filter) => (
                            <div
                              key={filter._id}
                              className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3"
                              style={{ backgroundColor: "var(--app-shell)" }}
                            >
                              <div>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "var(--app-text)" }}
                                >
                                  {filter.name}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "var(--app-text-soft)" }}
                                >
                                  {Object.keys(filter.criteria || {})
                                    .filter((key) => filter.criteria?.[key])
                                    .join(", ") || "Sin criterios"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => applySavedFilter(filter)}
                                  className="rounded-xl border px-3 py-2 text-xs"
                                  style={ghostStyle()}
                                >
                                  Usar
                                </button>
                                <button
                                  onClick={() =>
                                    runAction(
                                      async () => {
                                        const nextSettings =
                                          await deleteMyFilter(filter._id);
                                        setSettings(nextSettings);
                                      },
                                      "No se pudo eliminar el filtro",
                                      "Filtro eliminado correctamente",
                                      { refreshBoards: false },
                                    )
                                  }
                                  className="rounded-xl px-3 py-2 text-xs"
                                  style={{
                                    backgroundColor:
                                      "color-mix(in srgb, var(--app-danger) 14%, transparent)",
                                    color: "var(--app-danger)",
                                  }}
                                >
                                  Borrar
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p
                            className="text-sm"
                            style={{ color: "var(--app-text-soft)" }}
                          >
                            Aun no has guardado filtros personalizados.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {boardDetail ? (
                    <div className="app-scrollbar mt-8 overflow-x-auto">
                      <div className="flex min-w-max gap-4 pb-4">
                        {boardDetail.columns.map((column) => (
                          <Column
                            key={column._id}
                            column={column}
                            readOnly={selectedProject.status === "ARCHIVADO"}
                            onAddTask={(current) =>
                              setTaskModal({ open: true, column: current })
                            }
                            onTaskClick={openTaskDetail}
                            onTaskDragStart={(event, task) => {
                              event.dataTransfer.setData(
                                "text/task-id",
                                task._id,
                              );
                              event.dataTransfer.setData(
                                "text/task-column-id",
                                task.columnId,
                              );
                            }}
                            onTaskDrop={handleTaskDrop}
                            onRename={(current) =>
                              openPanel("column-edit", {
                                _id: current._id,
                                name: current.name,
                                order: current.order,
                                wipLimit: current.wipLimit || "",
                              })
                            }
                            onReorder={(current) =>
                              openPanel("column-edit", {
                                _id: current._id,
                                name: current.name,
                                order: current.order,
                                wipLimit: current.wipLimit || "",
                              })
                            }
                            onSetWipLimit={(current) =>
                              openPanel("column-edit", {
                                _id: current._id,
                                name: current.name,
                                order: current.order,
                                wipLimit: current.wipLimit || "",
                              })
                            }
                            onDelete={(current) =>
                              openPanel("column-delete", current)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="mt-8 rounded-2xl border border-dashed px-6 py-10 text-center"
                      style={{
                        borderColor: "var(--app-border)",
                        color: "var(--app-text-soft)",
                      }}
                    >
                      No hay tableros para este proyecto todavia.
                    </div>
                  )}
                  {archivedTasks.length ? (
                    <div
                      className="mt-8 rounded-[24px] p-5"
                      style={{ backgroundColor: "var(--app-surface)" }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p
                            className="text-xs uppercase tracking-[0.22em]"
                            style={{ color: "var(--app-text-muted)" }}
                          >
                            Archivadas
                          </p>
                          <h3
                            className="mt-2 text-xl font-semibold"
                            style={{ color: "var(--app-text)" }}
                          >
                            Tareas archivadas visibles
                          </h3>
                        </div>
                        <p
                          className="text-sm"
                          style={{ color: "var(--app-text-soft)" }}
                        >
                          Los usuarios pueden revisarlas, pero no editarlas.
                        </p>
                      </div>
                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {archivedTasks.map((task) => (
                          <button
                            key={task._id}
                            onClick={() => openTaskDetail(task)}
                            className="rounded-[24px] border p-4 text-left"
                            style={{
                              borderColor: "var(--app-border)",
                              backgroundColor: "var(--app-shell)",
                            }}
                          >
                            <p
                              className="text-xs uppercase tracking-[0.2em]"
                              style={{ color: "var(--app-text-muted)" }}
                            >
                              {task.type} • {task.priority}
                            </p>
                            <h4
                              className="mt-2 text-lg font-semibold"
                              style={{ color: "var(--app-text)" }}
                            >
                              {task.title}
                            </h4>
                            <p
                              className="mt-2 text-sm"
                              style={{ color: "var(--app-text-soft)" }}
                            >
                              {task.description || "Sin descripcion"}
                            </p>
                            <p
                              className="mt-3 text-xs"
                              style={{ color: "var(--app-text-muted)" }}
                            >
                              Archivada {formatDate(task.archivedAt)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {panel === "profile" ? (
                <FormPanel title="Mi perfil" onClose={() => setPanel(null)}>
                  <div className="grid gap-4">
                    <input
                      value={form.username || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      placeholder="Nombre de usuario"
                      className="app-input rounded-2xl px-4 py-3"
                    />
                    <input
                      value={form.avatar || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, avatar: e.target.value }))
                      }
                      placeholder="URL o data URL del avatar"
                      className="app-input rounded-2xl px-4 py-3"
                    />
                    <textarea
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descripcion de perfil"
                      rows={4}
                      className="app-input rounded-2xl px-4 py-3"
                    />
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setPanel(null)}
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={{ ...ghostStyle(), color: "var(--app-text-soft)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        runAction(
                          async () => {
                            const updatedUser = await updateMyProfile(form);
                            onUserUpdate?.(updatedUser);
                            setPanel(null);
                          },
                          "No se pudo actualizar el perfil",
                          "Perfil actualizado correctamente",
                          { refreshBoards: false },
                        )
                      }
                      disabled={busy}
                      className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                      style={primaryStyle()}
                    >
                      {busy ? "Guardando..." : "Guardar perfil"}
                    </button>
                  </div>
                </FormPanel>
              ) : null}
              {panel === "project-create" || panel === "project-edit" ? (
                <FormPanel
                  title={
                    panel === "project-create"
                      ? "Nuevo proyecto"
                      : "Editar proyecto"
                  }
                  onClose={() => setPanel(null)}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={form.name || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Nombre del proyecto"
                      className="app-input rounded-2xl px-4 py-3"
                    />
                    <input
                      type="date"
                      value={form.startDate || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="app-input rounded-2xl px-4 py-3"
                    />
                    <textarea
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descripcion"
                      rows={4}
                      className="app-input rounded-2xl px-4 py-3 md:col-span-2"
                    />
                    <input
                      type="date"
                      value={form.estimatedEndDate || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          estimatedEndDate: e.target.value,
                        }))
                      }
                      className="app-input rounded-2xl px-4 py-3"
                    />
                    <select
                      value={form.status || "PLANIFICADO"}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="app-input rounded-2xl px-4 py-3"
                    >
                      {STATUS_OPTIONS.filter(
                        (status) => status !== "ARCHIVADO",
                      ).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setPanel(null)}
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={{ ...ghostStyle(), color: "var(--app-text-soft)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        runAction(
                          async () => {
                            if (panel === "project-create") {
                              const created = await createProject(form);
                              navigate(`/projects/${created._id}`);
                            } else {
                              await updateProject(selectedProject._id, form);
                            }
                            setPanel(null);
                          },
                          "No se pudo guardar el proyecto",
                          panel === "project-create"
                            ? "Proyecto creado correctamente"
                            : "Proyecto actualizado correctamente",
                        )
                      }
                      disabled={busy}
                      className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                      style={primaryStyle()}
                    >
                      {busy ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </FormPanel>
              ) : null}
              {panel === "project-clone" && selectedProject ? (
                <FormPanel
                  title="Clonar proyecto"
                  onClose={() => setPanel(null)}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={form.name || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Nombre del nuevo proyecto"
                      className="app-input rounded-2xl px-4 py-3"
                    />
                    <input
                      type="date"
                      value={form.startDate || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="app-input rounded-2xl px-4 py-3"
                    />
                    <textarea
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descripcion base"
                      rows={4}
                      className="app-input rounded-2xl px-4 py-3 md:col-span-2"
                    />
                    <input
                      type="date"
                      value={form.estimatedEndDate || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          estimatedEndDate: e.target.value,
                        }))
                      }
                      className="app-input rounded-2xl px-4 py-3"
                    />
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setPanel(null)}
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={{ ...ghostStyle(), color: "var(--app-text-soft)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        runAction(
                          async () => {
                            const cloned = await cloneProject(
                              selectedProject._id,
                              form,
                            );
                            navigate(`/projects/${cloned._id}`);
                            setPanel(null);
                          },
                          "No se pudo clonar el proyecto",
                          "Proyecto clonado correctamente",
                        )
                      }
                      disabled={busy}
                      className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                      style={primaryStyle()}
                    >
                      {busy ? "Clonando..." : "Clonar proyecto"}
                    </button>
                  </div>
                </FormPanel>
              ) : null}
              {panel === "invite" && selectedProject ? (
                <FormPanel
                  title="Invitar miembro"
                  onClose={() => setPanel(null)}
                >
                  <input
                    value={form.email || ""}
                    onChange={(e) => setForm({ email: e.target.value })}
                    placeholder="correo@empresa.com"
                    className="app-input w-full rounded-2xl px-4 py-3"
                  />
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setPanel(null)}
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={{ ...ghostStyle(), color: "var(--app-text-soft)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        runAction(
                          async () => {
                            await inviteProjectMember(
                              selectedProject._id,
                              form.email,
                            );
                            setPanel(null);
                          },
                          "No se pudo enviar la invitacion",
                          "Invitacion enviada correctamente",
                        )
                      }
                      disabled={busy}
                      className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                      style={primaryStyle({
                        background:
                          "linear-gradient(135deg, var(--app-success), var(--app-primary))",
                      })}
                    >
                      {busy ? "Enviando..." : "Invitar"}
                    </button>
                  </div>
                </FormPanel>
              ) : null}
              {panel === "board" ? (
                <FormPanel title="Nuevo tablero" onClose={() => setPanel(null)}>
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm({ name: e.target.value })}
                    placeholder="Nombre del tablero"
                    className="app-input w-full rounded-2xl px-4 py-3"
                  />
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setPanel(null)}
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={{ ...ghostStyle(), color: "var(--app-text-soft)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        runAction(
                          async () => {
                            const board = await createBoard(
                              selectedProject._id,
                              form,
                            );
                            await refreshCurrentBoard(board._id);
                            setPanel(null);
                          },
                          "No se pudo crear el tablero",
                          "Tablero creado correctamente",
                        )
                      }
                      disabled={busy}
                      className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                      style={primaryStyle()}
                    >
                      {busy ? "Guardando..." : "Crear tablero"}
                    </button>
                  </div>
                </FormPanel>
              ) : null}
              {panel === "column" ||
              panel === "column-edit" ||
              panel === "column-delete" ? (
                <FormPanel
                  title={
                    panel === "column-delete"
                      ? "Eliminar columna"
                      : panel === "column-edit"
                        ? "Editar columna"
                        : "Nueva columna"
                  }
                  onClose={() => setPanel(null)}
                >
                  {panel === "column-delete" ? (
                    <>
                      <p
                        className="text-sm"
                        style={{ color: "var(--app-text-soft)" }}
                      >
                        Esta accion intentara eliminar la columna seleccionada.
                      </p>
                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          onClick={() => setPanel(null)}
                          className="rounded-2xl border px-4 py-3 text-sm"
                          style={{
                            ...ghostStyle(),
                            color: "var(--app-text-soft)",
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() =>
                            runAction(
                              async () => {
                                await deleteColumn(selectedBoardId, form._id);
                                await refreshCurrentBoard();
                                setPanel(null);
                              },
                              "No se pudo eliminar la columna",
                              "Columna eliminada correctamente",
                            )
                          }
                          disabled={busy}
                          className="rounded-2xl px-5 py-3 text-sm font-semibold"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--app-danger) 14%, transparent)",
                            color: "var(--app-danger)",
                          }}
                        >
                          {busy ? "Eliminando..." : "Eliminar columna"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <input
                          value={form.name || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Nombre"
                          className="app-input rounded-2xl px-4 py-3"
                        />
                        <input
                          type="number"
                          min="1"
                          value={form.order || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              order: e.target.value,
                            }))
                          }
                          placeholder="Orden"
                          className="app-input rounded-2xl px-4 py-3"
                        />
                        <input
                          type="number"
                          min="1"
                          value={form.wipLimit || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              wipLimit: e.target.value,
                            }))
                          }
                          placeholder="WIP Limit"
                          className="app-input rounded-2xl px-4 py-3"
                        />
                      </div>
                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          onClick={() => setPanel(null)}
                          className="rounded-2xl border px-4 py-3 text-sm"
                          style={{
                            ...ghostStyle(),
                            color: "var(--app-text-soft)",
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() =>
                            runAction(
                              async () => {
                                if (panel === "column")
                                  await createColumn(selectedBoardId, {
                                    name: form.name,
                                  });
                                else
                                  await updateColumn(
                                    selectedBoardId,
                                    form._id,
                                    {
                                      name: form.name,
                                      order: Number(form.order),
                                      wipLimit:
                                        form.wipLimit === ""
                                          ? null
                                          : Number(form.wipLimit),
                                    },
                                  );
                                await refreshCurrentBoard();
                                setPanel(null);
                              },
                              "No se pudo guardar la columna",
                              panel === "column"
                                ? "Columna creada correctamente"
                                : "Columna actualizada correctamente",
                            )
                          }
                          disabled={busy}
                          className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                          style={primaryStyle()}
                        >
                          {busy ? "Guardando..." : "Guardar columna"}
                        </button>
                      </div>
                    </>
                  )}
                </FormPanel>
              ) : null}
              {panel === "archive" || panel === "delete-project" ? (
                <FormPanel
                  title={
                    panel === "archive"
                      ? "Archivar proyecto"
                      : "Eliminar proyecto"
                  }
                  onClose={() => setPanel(null)}
                >
                  <p
                    className="text-sm"
                    style={{ color: "var(--app-text-soft)" }}
                  >
                    {panel === "archive"
                      ? "El proyecto pasara a solo lectura."
                      : "El proyecto, sus tableros y sus tareas seran eliminados."}
                  </p>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setPanel(null)}
                      className="rounded-2xl border px-4 py-3 text-sm"
                      style={{ ...ghostStyle(), color: "var(--app-text-soft)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        runAction(
                          async () => {
                            if (panel === "archive")
                              await archiveProject(selectedProject._id);
                            else {
                              await deleteProject(selectedProject._id);
                              navigate("/projects");
                            }
                            setPanel(null);
                          },
                          panel === "archive"
                            ? "No se pudo archivar el proyecto"
                            : "No se pudo eliminar el proyecto",
                          panel === "archive"
                            ? "Proyecto archivado correctamente"
                            : "Proyecto eliminado correctamente",
                          { refreshBoards: panel === "archive" },
                        )
                      }
                      disabled={busy}
                      className="rounded-2xl px-5 py-3 text-sm font-semibold"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--app-danger) 14%, transparent)",
                        color: "var(--app-danger)",
                      }}
                    >
                      {busy
                        ? "Procesando..."
                        : panel === "archive"
                          ? "Archivar proyecto"
                          : "Eliminar proyecto"}
                    </button>
                  </div>
                </FormPanel>
              ) : null}
            </main>
          </div>
        </div>
      </div>

      <TaskModal
        open={taskModal.open}
        column={taskModal.column}
        boardId={selectedBoardId}
        busy={busy}
        projectMembers={selectedProjectMembers}
        onClose={() => setTaskModal({ open: false, column: null })}
        onSubmit={(payload, errors) => {
          if (!Object.keys(errors).length)
            runAction(
              async () => {
                await createTask(payload);
                setTaskModal({ open: false, column: null });
                await refreshCurrentBoard();
              },
              "No se pudo crear la tarea",
              "Tarea creada correctamente",
            );
        }}
      />
      <TaskDetailModal
        key={`${taskDetail.open}-${taskDetail.task?._id || "empty"}`}
        open={taskDetail.open}
        task={{ ...taskDetail.task, currentUserRole: user?.role }}
        busy={busy}
        currentUserId={currentUserId}
        projectMembers={selectedProjectMembers}
        onClose={() => setTaskDetail({ open: false, task: null })}
        onUpdateAssignees={(assignees) =>
          handleTaskAction(
            () => updateTaskAssignees(taskDetail.task._id, assignees),
            "No se pudo actualizar la asignacion",
            "Responsables actualizados correctamente",
          )
        }
        onClone={(payload) =>
          handleTaskAction(
            () => cloneTask(taskDetail.task._id, payload),
            "No se pudo clonar la tarea",
            "Tarea clonada correctamente",
          )
        }
        onUndo={() =>
          handleTaskAction(
            () => undoTask(taskDetail.task._id),
            "No se pudo deshacer el ultimo cambio",
            "Ultimo cambio revertido",
          )
        }
        onDeleteTask={() =>
          runAction(
            async () => {
              await deleteTask(taskDetail.task._id);
              setTaskDetail({ open: false, task: null });
              await refreshCurrentBoard();
            },
            "No se pudo eliminar la tarea",
            "Tarea eliminada correctamente",
          )
        }
        onAddSubtask={(payload) =>
          handleTaskAction(
            () => addSubtask(taskDetail.task._id, payload),
            "No se pudo crear la subtarea",
            "Subtarea creada correctamente",
          )
        }
        onToggleSubtask={(subtask, payload) =>
          handleTaskAction(
            () => updateSubtask(taskDetail.task._id, subtask._id, payload),
            "No se pudo actualizar la subtarea",
            "Subtarea actualizada correctamente",
          )
        }
        onAddComment={(payload) =>
          handleTaskAction(
            () => addComment(taskDetail.task._id, payload),
            "No se pudo crear el comentario",
            "Comentario agregado correctamente",
          )
        }
        onUpdateComment={(comment, payload) =>
          handleTaskAction(
            () => updateComment(taskDetail.task._id, comment._id, payload),
            "No se pudo actualizar el comentario",
            "Comentario actualizado correctamente",
          )
        }
        onDeleteComment={(comment) =>
          handleTaskAction(
            () => deleteComment(taskDetail.task._id, comment._id),
            "No se pudo eliminar el comentario",
            "Comentario eliminado correctamente",
          )
        }
        onAddAttachment={(payload) =>
          handleTaskAction(
            () => addAttachment(taskDetail.task._id, payload),
            "No se pudo adjuntar el archivo",
            "Adjunto agregado correctamente",
          )
        }
        onAddTimeLog={(payload) =>
          handleTaskAction(
            () => addTimeLog(taskDetail.task._id, payload),
            "No se pudo registrar el tiempo",
            "Tiempo registrado correctamente",
          )
        }
      />
      <AdminPanel
        open={adminPanelOpen}
        data={adminData}
        busy={busy}
        onClose={() => setAdminPanelOpen(false)}
        onRefresh={loadAdminPanel}
        onExportCsv={async (project) => {
          const blob = await exportProjectCsv(project._id);
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${project.name}-report.csv`;
          anchor.click();
          URL.revokeObjectURL(url);
        }}
        onUpdateUser={async (userId, payload) => {
          const updatedUser = await updateAdminUser(userId, payload);
          setAdminData((prev) =>
            prev
              ? {
                  ...prev,
                  users: prev.users.map((item) =>
                    item._id === userId ? updatedUser : item,
                  ),
                }
              : prev,
          );
        }}
      />
    </div>
  );
}
