const ProjectService = require("../../application/services/project.service");
const CreateProjectUseCase = require("../../application/use-cases/create-project.use-case");
const CloneProjectUseCase = require("../../application/use-cases/clone-project.use-case");
const ArchiveProjectUseCase = require("../../application/use-cases/archive-project.use-case");

exports.create = async (req, res) => {
  try {
    const project = await CreateProjectUseCase.execute(req.body, req.user.id);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const projects = await ProjectService.getProjects(req.user);
    res.json(projects);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id, req.user);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const project = await ProjectService.updateProject(req.params.id, req.body, req.user);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await ProjectService.deleteProject(req.params.id, req.user);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.invite = async (req, res) => {
  try {
    const result = await ProjectService.inviteMember(req.params.id, req.body.email, req.user);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.clone = async (req, res) => {
  try {
    const project = await CloneProjectUseCase.execute(req.params.id, req.body, req.user);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.archive = async (req, res) => {
  try {
    const project = await ArchiveProjectUseCase.execute(req.params.id, req.user);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const project = await ProjectService.changeProjectStatus(req.params.id, req.body.status, req.user);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const data = await ProjectService.getProjectAuditLogs(req.params.id, req.user);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const data = await ProjectService.getProjectDashboard(req.params.id, req.user);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const csv = await ProjectService.exportProjectCsv(req.params.id, req.user);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="project-${req.params.id}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    const pdf = await ProjectService.exportProjectPdf(req.params.id, req.user);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="project-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
