const mongoose = require("mongoose");
const Project = require("../../domain/entities/Project");
const Board = require("../../domain/entities/Board");
const Task = require("../../domain/entities/Task");
const User = require("../../domain/entities/User");
const ProjectMember = require("../../domain/entities/ProjectMember");
const ProjectFactoryResolver = require("../../domain/factories/projects/ProjectFactoryResolver");
const BoardFactoryResolver = require("../../domain/factories/boards/BoardFactoryResolver");
const { ProjectStatus, PROJECT_STATUSES } = require("../../domain/value-objects/ProjectStatus");
const invitationEmailService = require("../../infrastructure/email/MockInvitationEmailService");
const AuditLogService = require("./audit-log.service");
const domainEvents = require("../../infrastructure/events/domain-events");

function getUserId(user) {
  return user?.id?.toString?.() || user?._id?.toString?.() || null;
}

function isCreatorOrAdmin(project, user) {
  return project.createdBy?.toString?.() === getUserId(user) || user.role === "ADMIN";
}

function isMember(project, userId) {
  const normalizedUserId = userId?.toString?.() || userId;
  return project.members.some((member) => {
    const memberId = member?._id?.toString?.() || member?.toString?.() || null;
    return memberId === normalizedUserId;
  });
}

async function ensureCanManage(project, user) {
  if (isCreatorOrAdmin(project, user)) {
    return true;
  }

  const membership = await ProjectMember.findOne({
    projectId: project._id,
    userId: getUserId(user),
    status: "ACTIVE"
  }).select("role");

  if (membership?.role === "OWNER") {
    return true;
  }

  throw new Error("No permission to manage this project");
}

function ensureCanAccess(project, user) {
  if (!isCreatorOrAdmin(project, user) && !isMember(project, getUserId(user))) {
    throw new Error("No permission to access this project");
  }
}

function ensureNotArchived(project) {
  if (ProjectStatus.isReadOnly(project.status)) {
    throw new Error("Archived projects are read-only");
  }
}

async function createProjectMembersForOwner(project, owner) {
  await ProjectMember.updateOne(
    { projectId: project._id, email: owner.email },
    {
      projectId: project._id,
      userId: owner._id,
      email: owner.email,
      role: "OWNER",
      status: "ACTIVE",
      invitedBy: owner._id,
      joinedAt: new Date()
    },
    { upsert: true }
  );
}

async function createDefaultBoard(projectId) {
  const boardFactory = BoardFactoryResolver.create("default");
  return Board.create(boardFactory.create(projectId));
}

async function cloneProjectBoards(sourceProjectId, targetProjectId) {
  const sourceBoards = await Board.find({ projectId: sourceProjectId });

  if (!sourceBoards.length) {
    await createDefaultBoard(targetProjectId);
    return;
  }

  const clonedBoards = sourceBoards.map((board) => ({
    projectId: targetProjectId,
    name: board.name,
    columns: board.columns.map((column) => ({
      name: column.name,
      order: column.order,
      wipLimit: column.wipLimit
    }))
  }));

  await Board.insertMany(clonedBoards);
}

async function calculateProjectProgress(projectId) {
  const boards = await Board.find({ projectId }).select("_id columns");
  const boardIds = boards.map((board) => board._id);

  if (!boardIds.length) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      progress: 0
    };
  }

  const tasks = await Task.find({ boardId: { $in: boardIds } }).select("columnId completedAt");
  const completedColumnIds = new Set(
    boards.flatMap((board) =>
      (board.columns || [])
        .filter((column) => {
          const normalizedName = column.name
            ?.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

          return normalizedName?.includes("complet") || normalizedName?.includes("done");
        })
        .map((column) => column._id.toString())
    )
  );
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) =>
    Boolean(task.completedAt) ||
    completedColumnIds.has((task.columnId || "").toString())
  ).length;

  return {
    totalTasks,
    completedTasks,
    progress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
}

async function enrichProject(project) {
  const progressData = await calculateProjectProgress(project._id);

  return {
    _id: project._id,
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    estimatedEndDate: project.estimatedEndDate,
    status: project.status,
    createdBy: project.createdBy,
    templateSourceProjectId: project.templateSourceProjectId,
    archivedAt: project.archivedAt,
    members: (project.members || []).map((member) => ({
      _id: member._id,
      username: member.username,
      email: member.email,
      role: member.role
    })),
    memberCount: project.members?.length || 0,
    ...progressData
  };
}

async function getProjectOrThrow(projectId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project id");
  }

  const project = await Project.findById(projectId).populate("members", "username email role");

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

exports.createProject = async (data, userId) => {
  const owner = await User.findById(userId);

  if (!owner) {
    throw new Error("Owner not found");
  }

  const creator = ProjectFactoryResolver.create("new");
  const projectData = creator.create(data, { userId: owner._id });
  projectData.status = ProjectStatus.ensureValid(projectData.status);

  if (projectData.status === PROJECT_STATUSES.ARCHIVADO) {
    throw new Error("A project cannot be created as archived");
  }

  const project = await Project.create(projectData);
  await createDefaultBoard(project._id);
  await createProjectMembersForOwner(project, owner);
  domainEvents.emit("project.event", {
    projectId: project._id,
    action: "PROJECT_CREATED",
    actorId: owner._id,
    meta: {
      name: project.name
    }
  });

  return enrichProject(await Project.findById(project._id).populate("members", "username email role"));
};

exports.getProjects = async (user) => {
  const query = user.role === "ADMIN" ? {} : { members: user.id };
  const projects = await Project.find(query)
    .populate("members", "username email role")
    .sort({ createdAt: -1 });

  return Promise.all(projects.map(enrichProject));
};

exports.getProjectById = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);
  return enrichProject(project);
};

exports.updateProject = async (id, data, user) => {
  const project = await getProjectOrThrow(id);
  await ensureCanManage(project, user);
  ensureNotArchived(project);

  if (data.status && data.status !== project.status) {
    project.status = ProjectStatus.ensureTransition(project.status, data.status);
  }

  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      throw new Error("Project name is required");
    }
    project.name = data.name.trim();
  }

  if (data.description !== undefined) {
    project.description = data.description?.trim() || "";
  }

  if (data.startDate !== undefined) {
    project.startDate = new Date(data.startDate);
  }

  if (data.estimatedEndDate !== undefined) {
    project.estimatedEndDate = new Date(data.estimatedEndDate);
  }

  if (project.estimatedEndDate < project.startDate) {
    throw new Error("estimatedEndDate must be after startDate");
  }

  await project.save();
  domainEvents.emit("project.event", {
    projectId: project._id,
    action: "PROJECT_UPDATED",
    actorId: user.id,
    meta: {
      status: project.status
    }
  });
  return enrichProject(await Project.findById(project._id).populate("members", "username email role"));
};

exports.deleteProject = async (id, user) => {
  const project = await getProjectOrThrow(id);
  await ensureCanManage(project, user);

  const boards = await Board.find({ projectId: project._id }).select("_id");
  const boardIds = boards.map((board) => board._id);

  if (boardIds.length) {
    await Task.deleteMany({ boardId: { $in: boardIds } });
  }

  await Board.deleteMany({ projectId: project._id });
  await ProjectMember.deleteMany({ projectId: project._id });
  await Project.findByIdAndDelete(project._id);
  domainEvents.emit("project.event", {
    projectId: project._id,
    action: "PROJECT_DELETED",
    actorId: user.id,
    meta: {
      name: project.name
    }
  });

  return { success: true };
};

exports.inviteMember = async (projectId, email, user) => {
  const project = await getProjectOrThrow(projectId);
  await ensureCanManage(project, user);
  ensureNotArchived(project);

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const existingInvitation = await ProjectMember.findOne({
    projectId: project._id,
    email: normalizedEmail
  });

  if (existingInvitation) {
    throw new Error("This email has already been invited");
  }

  const invitedUser = await User.findOne({ email: normalizedEmail });
  const invitationStatus = invitedUser ? "ACTIVE" : "INVITED";

  await ProjectMember.create({
    projectId: project._id,
    userId: invitedUser?._id || null,
    email: normalizedEmail,
    role: "MEMBER",
    status: invitationStatus,
    invitedBy: user.id,
    joinedAt: invitedUser ? new Date() : null
  });

  if (invitedUser) {
    const alreadyMember = project.members.some(
      (memberId) => memberId.toString() === invitedUser._id.toString()
    );

    if (!alreadyMember) {
      project.members.push(invitedUser._id);
      await project.save();
    }
  }

  await invitationEmailService.sendProjectInvitation({
    to: normalizedEmail,
    projectName: project.name,
    invitedByEmail: user.email || "system"
  });

  return {
    success: true,
    email: normalizedEmail,
    status: invitationStatus
  };
};

exports.cloneProject = async (projectId, data, user) => {
  const sourceProject = await getProjectOrThrow(projectId);
  ensureCanAccess(sourceProject, user);

  const creator = ProjectFactoryResolver.create("clone");
  const projectData = creator.create(data, {
    userId: user.id,
    sourceProject
  });

  const clonedProject = await Project.create(projectData);
  const owner = await User.findById(user.id);

  if (owner) {
    await createProjectMembersForOwner(clonedProject, owner);
  }

  await cloneProjectBoards(sourceProject._id, clonedProject._id);
  domainEvents.emit("project.event", {
    projectId: clonedProject._id,
    action: "PROJECT_CLONED",
    actorId: user.id,
    meta: {
      sourceProjectId: sourceProject._id.toString()
    }
  });

  return enrichProject(await Project.findById(clonedProject._id).populate("members", "username email role"));
};

exports.archiveProject = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  await ensureCanManage(project, user);

  project.status = ProjectStatus.ensureTransition(project.status, PROJECT_STATUSES.ARCHIVADO);
  project.archivedAt = new Date();

  await project.save();
  domainEvents.emit("project.event", {
    projectId: project._id,
    action: "PROJECT_ARCHIVED",
    actorId: user.id,
    meta: {}
  });

  return enrichProject(await Project.findById(project._id).populate("members", "username email role"));
};

exports.changeProjectStatus = async (projectId, nextStatus, user) => {
  const project = await getProjectOrThrow(projectId);
  await ensureCanManage(project, user);
  ensureNotArchived(project);

  project.status = ProjectStatus.ensureTransition(project.status, nextStatus);

  if (project.status === PROJECT_STATUSES.ARCHIVADO) {
    project.archivedAt = new Date();
  }

  await project.save();
  domainEvents.emit("project.event", {
    projectId: project._id,
    action: "PROJECT_STATUS_CHANGED",
    actorId: user.id,
    meta: {
      status: project.status
    }
  });

  return enrichProject(await Project.findById(project._id).populate("members", "username email role"));
};

exports.getProjectAuditLogs = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);
  return AuditLogService.listByProject(projectId);
};

exports.getProjectDashboard = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);

  const boards = await Board.find({ projectId }).select("_id columns");
  const boardIds = boards.map((board) => board._id);
  const tasks = boardIds.length ? await Task.find({ boardId: { $in: boardIds } }).populate("assignees", "username email") : [];
  const progressData = await calculateProjectProgress(projectId);
  const completedColumnIds = new Set(
    boards.flatMap((board) =>
      (board.columns || [])
        .filter((column) => column.name.toLowerCase().includes("complet"))
        .map((column) => column._id.toString())
    )
  );

  const tasksByStatus = boards.flatMap((board) => board.columns || []).reduce((acc, column) => {
    acc[column.name] = tasks.filter((task) => task.columnId?.toString?.() === column._id.toString() || task.columnId === column.name).length;
    return acc;
  }, {});

  const tasksByUser = tasks.reduce((acc, task) => {
    if (!task.assignees?.length) {
      acc["Sin asignar"] = (acc["Sin asignar"] || 0) + 1;
      return acc;
    }

    task.assignees.forEach((assignee) => {
      const label = assignee.username || assignee.email;
      acc[label] = (acc[label] || 0) + 1;
    });

    return acc;
  }, {});

  const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate.getTime() < Date.now() && !completedColumnIds.has(task.columnId?.toString?.())).length;
  const completedByWeek = tasks
    .filter((task) => completedColumnIds.has(task.columnId?.toString?.()))
    .reduce((acc, task) => {
      const date = task.updatedAt || task.createdAt;
      const startOfWeek = new Date(date);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const key = startOfWeek.toISOString().slice(0, 10);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  return {
    project: {
      _id: project._id,
      name: project.name,
      status: project.status
    },
    overview: {
      totalTasks: tasks.length,
      overdueTasks,
      progress: progressData.progress
    },
    tasksByStatus,
    tasksByUser,
    completedByWeek
  };
};

exports.exportProjectCsv = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);
  const boards = await Board.find({ projectId }).select("_id");
  const boardIds = boards.map((board) => board._id);
  const tasks = boardIds.length ? await Task.find({ boardId: { $in: boardIds } }).populate("assignees", "username email") : [];
  const lines = [
    ["title", "type", "priority", "dueDate", "estimatedHours", "spentHours", "assignees"].join(","),
    ...tasks.map((task) => [
      `"${(task.title || "").replace(/"/g, '""')}"`,
      task.type || "",
      task.priority || "",
      task.dueDate ? task.dueDate.toISOString() : "",
      task.estimatedHours || 0,
      task.spentHours || 0,
      `"${(task.assignees || []).map((assignee) => assignee.username || assignee.email).join(" | ")}"`
    ].join(","))
  ];

  return lines.join("\n");
};

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

exports.exportProjectPdf = async (projectId, user) => {
  const dashboard = await exports.getProjectDashboard(projectId, user);
  const lines = [
    `Reporte del proyecto: ${dashboard.project.name}`,
    `Estado: ${dashboard.project.status}`,
    `Total tareas: ${dashboard.overview.totalTasks}`,
    `Tareas vencidas: ${dashboard.overview.overdueTasks}`,
    `Progreso general: ${dashboard.overview.progress}%`,
    "",
    "Tareas por estado:",
    ...Object.entries(dashboard.tasksByStatus).map(([label, value]) => `- ${label}: ${value}`),
    "",
    "Tareas por usuario:",
    ...Object.entries(dashboard.tasksByUser).map(([label, value]) => `- ${label}: ${value}`),
    "",
    "Velocidad por semana:",
    ...Object.entries(dashboard.completedByWeek).map(([label, value]) => `- ${label}: ${value}`)
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
};

exports.ensureProjectIsWritableFromBoard = async (boardId) => {
  const board = await Board.findById(boardId).select("projectId");

  if (!board) {
    throw new Error("Board not found");
  }

  const project = await Project.findById(board.projectId).select("status");

  if (!project) {
    throw new Error("Project not found");
  }

  if (ProjectStatus.isReadOnly(project.status)) {
    throw new Error("Archived projects are read-only");
  }

  return project;
};

exports.ensureTaskIsWritable = async (taskId) => {
  const task = await Task.findById(taskId).select("boardId");

  if (!task) {
    throw new Error("Task not found");
  }

  await exports.ensureProjectIsWritableFromBoard(task.boardId);
  return task;
};
