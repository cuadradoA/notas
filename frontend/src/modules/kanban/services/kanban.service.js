import { api } from "../../../core/api/axios";

export const getProjects = async () => {
  const res = await api.get("/projects");
  return res.data;
};

export const createProject = async (payload) => {
  const res = await api.post("/projects", payload);
  return res.data;
};

export const updateProject = async (projectId, payload) => {
  const res = await api.put(`/projects/${projectId}`, payload);
  return res.data;
};

export const deleteProject = async (projectId) => {
  const res = await api.delete(`/projects/${projectId}`);
  return res.data;
};

export const inviteProjectMember = async (projectId, email) => {
  const res = await api.post(`/projects/${projectId}/invite`, { email });
  return res.data;
};

export const cloneProject = async (projectId, payload) => {
  const res = await api.post(`/projects/${projectId}/clone`, payload);
  return res.data;
};

export const archiveProject = async (projectId) => {
  const res = await api.post(`/projects/${projectId}/archive`);
  return res.data;
};

export const changeProjectStatus = async (projectId, status) => {
  const res = await api.patch(`/projects/${projectId}/status`, { status });
  return res.data;
};

export const getBoardsByProject = async (projectId) => {
  const res = await api.get(`/boards/project/${projectId}`);
  return res.data;
};

export const getBoardById = async (boardId) => {
  const res = await api.get(`/boards/${boardId}`);
  return res.data;
};

export const createBoard = async (projectId, payload) => {
  const res = await api.post(`/boards/project/${projectId}`, payload);
  return res.data;
};

export const createColumn = async (boardId, payload) => {
  const res = await api.post(`/boards/${boardId}/columns`, payload);
  return res.data;
};

export const updateColumn = async (boardId, columnId, payload) => {
  const res = await api.patch(`/boards/${boardId}/columns/${columnId}`, payload);
  return res.data;
};

export const deleteColumn = async (boardId, columnId) => {
  const res = await api.delete(`/boards/${boardId}/columns/${columnId}`);
  return res.data;
};

export const setColumnWipLimit = async (boardId, columnId, wipLimit) => {
  const res = await api.patch(`/boards/${boardId}/columns/${columnId}/wip-limit`, { wipLimit });
  return res.data;
};

export const createTask = async (payload) => {
  const res = await api.post("/tasks", payload);
  return res.data;
};

export const getTaskById = async (taskId) => {
  const res = await api.get(`/tasks/${taskId}`);
  return res.data;
};

export const getTasksByBoard = async (boardId) => {
  const res = await api.get(`/tasks/board/${boardId}`);
  return res.data;
};

export const moveTask = async (taskId, columnId) => {
  const res = await api.patch(`/tasks/${taskId}/move`, { columnId });
  return res.data;
};

export const updateTaskAssignees = async (taskId, assignees) => {
  const res = await api.patch(`/tasks/${taskId}/assignees`, { assignees });
  return res.data;
};

export const cloneTask = async (taskId, payload = {}) => {
  const res = await api.post(`/tasks/${taskId}/clone`, payload);
  return res.data;
};

export const addSubtask = async (taskId, payload) => {
  const res = await api.post(`/tasks/${taskId}/subtasks`, payload);
  return res.data;
};

export const updateSubtask = async (taskId, subtaskId, payload) => {
  const res = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, payload);
  return res.data;
};

export const addComment = async (taskId, payload) => {
  const res = await api.post(`/tasks/${taskId}/comments`, payload);
  return res.data;
};

export const updateComment = async (taskId, commentId, payload) => {
  const res = await api.patch(`/tasks/${taskId}/comments/${commentId}`, payload);
  return res.data;
};

export const deleteComment = async (taskId, commentId) => {
  const res = await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  return res.data;
};

export const addAttachment = async (taskId, payload) => {
  const res = await api.post(`/tasks/${taskId}/attachments`, payload);
  return res.data;
};

export const addTimeLog = async (taskId, payload) => {
  const res = await api.post(`/tasks/${taskId}/time-logs`, payload);
  return res.data;
};

export const undoTask = async (taskId) => {
  const res = await api.post(`/tasks/${taskId}/undo`);
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await api.delete(`/tasks/${taskId}`);
  return res.data;
};

export const searchBoardTasks = async (boardId, filters) => {
  const res = await api.get(`/tasks/board/${boardId}/search`, { params: filters });
  return res.data;
};

export const getProjectDashboard = async (projectId) => {
  const res = await api.get(`/projects/${projectId}/dashboard`);
  return res.data;
};

export const getProjectAuditLogs = async (projectId) => {
  const res = await api.get(`/projects/${projectId}/audit-logs`);
  return res.data;
};

export const exportProjectCsv = async (projectId) => {
  const res = await api.get(`/projects/${projectId}/export.csv`, { responseType: "blob" });
  return res.data;
};

export const exportProjectPdf = async (projectId) => {
  const res = await api.get(`/projects/${projectId}/export.pdf`, { responseType: "blob" });
  return res.data;
};

export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await api.patch(`/notifications/${notificationId}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.post("/notifications/read-all");
  return res.data;
};

export const getMySettings = async () => {
  const res = await api.get("/settings/me");
  return res.data;
};

export const updateMySettings = async (payload) => {
  const res = await api.patch("/settings/me", payload);
  return res.data;
};

export const saveMyFilter = async (payload) => {
  const res = await api.post("/settings/me/filters", payload);
  return res.data;
};

export const deleteMyFilter = async (filterId) => {
  const res = await api.delete(`/settings/me/filters/${filterId}`);
  return res.data;
};

export const getAdminOverview = async () => {
  const res = await api.get("/admin/overview");
  return res.data;
};

export const updateAdminUser = async (userId, payload) => {
  const res = await api.patch(`/admin/users/${userId}`, payload);
  return res.data;
};

export const getMyProfile = async () => {
  const res = await api.get("/users/me");
  return res.data;
};

export const updateMyProfile = async (payload) => {
  const res = await api.patch("/users/me", payload);
  return res.data;
};
