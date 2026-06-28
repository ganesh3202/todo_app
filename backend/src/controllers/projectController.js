const { Op } = require('sequelize');
const { Project, Task, User } = require('../models');

const projectIncludes = [
  { model: User, as: 'owner', attributes: ['id', 'name', 'avatar'] }
];

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = { ownerId: req.user.id };
    if (status) where.status = status;
    if (search) where.name   = { [Op.like]: `%${search}%` };

    const projects = await Project.findAll({
      where,
      include: projectIncludes,
      order: [['createdAt', 'DESC']]
    });

    // Attach task counts
    const projectsWithStats = await Promise.all(projects.map(async (p) => {
      const [total, completed, overdue] = await Promise.all([
        Task.count({ where: { projectId: p.id } }),
        Task.count({ where: { projectId: p.id, status: 'completed' } }),
        Task.count({ where: { projectId: p.id, status: { [Op.ne]: 'completed' }, dueDate: { [Op.lt]: new Date() } } })
      ]);
      return { ...p.toJSON(), taskStats: { total, completed, overdue } };
    }));

    res.json({ success: true, projects: projectsWithStats });
  } catch (err) {
    console.error('getProjects:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, color, icon, status, priority, startDate, deadline, tags } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Project name is required' });

    const project = await Project.create({
      name, description, color, icon, status, priority,
      startDate: startDate || null, deadline: deadline || null,
      tags: tags || [], ownerId: req.user.id
    });

    const full = await Project.findByPk(project.id, { include: projectIncludes });
    res.status(201).json({ success: true, project: full });
  } catch (err) {
    console.error('createProject:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, ownerId: req.user.id },
      include: projectIncludes
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks = await Task.findAll({
      where: { projectId: project.id },
      include: [{ model: User, as: 'assignedTo', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, project, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await project.update(req.body);
    const updated = await Project.findByPk(project.id, { include: projectIncludes });
    res.json({ success: true, project: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Nullify tasks' projectId before deleting
    await Task.update({ projectId: null }, { where: { projectId: project.id } });
    await project.destroy();

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
