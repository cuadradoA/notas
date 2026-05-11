const mongoose = require("mongoose");
const Project = require("../../domain/entities/Project");
const Board = require("../../domain/entities/Board");
const Task = require("../../domain/entities/Task");
const User = require("../../domain/entities/User");
const ProjectMember = require("../../domain/entities/ProjectMember");
const Notification = require("../../domain/entities/Notification");
const ProjectFactoryResolver = require("../../domain/factories/projects/ProjectFactoryResolver");
const BoardFactoryResolver = require("../../domain/factories/boards/BoardFactoryResolver");
const { ProjectStatus, PROJECT_STATUSES } = require("../../domain/value-objects/ProjectStatus");
const invitationEmailService = require("../../infrastructure/email/MockInvitationEmailService");
const AuditLogService = require("./audit-log.service");
const domainEvents = require("../../infrastructure/events/domain-events");
const ProjectReportingFacade = require("../reporting/facades/ProjectReportingFacade");
const NotificationService = require("./notification.service");

function getUserId(user) {
  return user?.id?.toString?.() || user?._id?.toString?.() || null;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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
  const project = await Project.findById(projectId).select("name status");

  if (!project) {
    throw new Error("Project not found");
  }

  return ProjectReportingFacade.getOverviewMetrics(project);
}

async function syncProjectInvitationNotification(invitationId, userId, invitationStatus) {
  await Notification.updateMany(
    {
      userId,
      type: "PROJECT_INVITATION",
      "meta.invitationId": invitationId.toString()
    },
    {
      $set: {
        read: invitationStatus !== "INVITED",
        "meta.invitationStatus": invitationStatus,
        "meta.resolvedAt": invitationStatus === "INVITED" ? null : new Date().toISOString()
      }
    }
  );
}

async function notifyInvitationRecipient({ invitation, project, inviter, recipientUser }) {
  if (!recipientUser) {
    return null;
  }

  const message = `${inviter.username || inviter.email || "Alguien"} te invito a colaborar en ${project.name}`;

  return NotificationService.notify(recipientUser._id, message, "PROJECT_INVITATION", {
    title: "Invitacion de proyecto",
    meta: {
      invitationId: invitation._id.toString(),
      invitationStatus: invitation.status,
      projectId: project._id.toString(),
      projectName: project.name,
      invitedById: getUserId(inviter),
      invitedByEmail: inviter.email || "",
      invitedByName: inviter.username || inviter.email || "Usuario"
    }
  });
}

async function notifyInvitationResolution({ project, invitation, actor, decision }) {
  const inviterId = getUserId(invitation.invitedBy);

  if (!inviterId || inviterId === getUserId(actor)) {
    return null;
  }

  const actorName = actor.username || actor.email || "Un usuario";
  const title = decision === "ACCEPTED" ? "Invitacion aceptada" : "Invitacion rechazada";
  const message = decision === "ACCEPTED"
    ? `${actorName} acepto tu invitacion al proyecto ${project.name}`
    : `${actorName} rechazo tu invitacion al proyecto ${project.name}`;

  return NotificationService.notify(inviterId, message, `PROJECT_INVITATION_${decision}`, {
    title,
    meta: {
      invitationId: invitation._id.toString(),
      invitationStatus: decision,
      projectId: project._id.toString(),
      projectName: project.name,
      actorId: getUserId(actor),
      actorName,
      syncProjects: true
    }
  });
}

async function resolveInvitationForCurrentUser(invitationId, user, nextStatus) {
  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw new Error("Invalid invitation id");
  }

  const invitation = await ProjectMember.findById(invitationId).populate("invitedBy", "username email");

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  const userId = getUserId(user);
  const matchesUser =
    invitation.userId?.toString?.() === userId ||
    invitation.email === normalizeEmail(user.email);

  if (!matchesUser) {
    throw new Error("You cannot manage this invitation");
  }

  if (invitation.status !== "INVITED") {
    throw new Error("This invitation has already been resolved");
  }

  const project = await getProjectOrThrow(invitation.projectId);

  if (nextStatus === "ACTIVE") {
    const alreadyMember = project.members.some((member) => member._id?.toString?.() === userId || member.toString?.() === userId);

    if (!alreadyMember) {
      project.members.push(userId);
      await project.save();
    }

    invitation.status = "ACTIVE";
    invitation.userId = userId;
    invitation.joinedAt = new Date();
  } else {
    invitation.status = "REJECTED";
  }

  invitation.respondedAt = new Date();
  await invitation.save();
  await syncProjectInvitationNotification(invitation._id, userId, invitation.status);
  await notifyInvitationResolution({
    project,
    invitation,
    actor: user,
    decision: nextStatus === "ACTIVE" ? "ACCEPTED" : "REJECTED"
  });

  domainEvents.emit("project.event", {
    projectId: project._id,
    action: nextStatus === "ACTIVE" ? "PROJECT_INVITATION_ACCEPTED" : "PROJECT_INVITATION_REJECTED",
    actorId: userId,
    meta: {
      invitationId: invitation._id.toString(),
      email: invitation.email
    }
  });

  return {
    success: true,
    invitationId: invitation._id.toString(),
    status: invitation.status,
    project: await enrichProject(await Project.findById(project._id).populate("members", "username email role"))
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

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  if (normalizedEmail === normalizeEmail(user.email)) {
    throw new Error("You are already part of this project");
  }

  const existingInvitation = await ProjectMember.findOne({
    projectId: project._id,
    email: normalizedEmail
  });

  if (existingInvitation?.status === "ACTIVE") {
    throw new Error("This user already belongs to the project");
  }

  if (existingInvitation?.status === "INVITED") {
    throw new Error("This email has already been invited");
  }

  const invitedUser = await User.findOne({ email: normalizedEmail });
  const invitation = existingInvitation || new ProjectMember({
    projectId: project._id,
    email: normalizedEmail
  });

  invitation.userId = invitedUser?._id || null;
  invitation.role = "MEMBER";
  invitation.status = "INVITED";
  invitation.invitedBy = user.id;
  invitation.joinedAt = null;
  invitation.respondedAt = null;
  await invitation.save();

  await notifyInvitationRecipient({
    invitation,
    project,
    inviter: user,
    recipientUser: invitedUser
  });

  await invitationEmailService.sendProjectInvitation({
    to: normalizedEmail,
    projectName: project.name,
    invitedByEmail: user.email || "system"
  });

  return {
    success: true,
    email: normalizedEmail,
    status: invitation.status,
    invitationId: invitation._id.toString(),
    delivery: invitedUser ? "IN_APP_AND_EMAIL" : "EMAIL_ONLY"
  };
};

exports.acceptInvitation = async (invitationId, user) => {
  return resolveInvitationForCurrentUser(invitationId, user, "ACTIVE");
};

exports.rejectInvitation = async (invitationId, user) => {
  return resolveInvitationForCurrentUser(invitationId, user, "REJECTED");
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

  return ProjectReportingFacade.getDashboard(project);
};

exports.exportProjectCsv = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);
  return ProjectReportingFacade.export(project, "csv");
};

exports.exportProjectPdf = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);
  return ProjectReportingFacade.export(project, "pdf");
};

exports.exportProjectJson = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);
  return ProjectReportingFacade.export(project, "json");
};

exports.getProjectStructure = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  ensureCanAccess(project, user);
  return ProjectReportingFacade.getStructure(project);
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
