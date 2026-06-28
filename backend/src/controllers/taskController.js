const { Op }  = require('sequelize');
const { Task, TaskComment, Project, User } = require('../models');

// helper: recalculate project progress after task changes
const refreshProjectProgress = async (projectId) => {
  if (!projectId) return;
  const total     = await Task.count({ where: { projectId } });
  const completed = await Task.count({ where: { projectId, status: 'completed' } });
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;
  await Project.update({ progress }, { where: { id: projectId } });
};

// Common include for task queries
const taskIncludes = [
  { model: Project,  as: 'project',    attributes: ['id', 'name', 'color'] },
  { model: User,     as: 'assignedTo', attributes: ['id', 'name', 'avatar'] },
  { model: User,     as: 'createdBy',  attributes: ['id', 'name'] }
];

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, projectId, search, page = 1, limit = 50, sortBy = 'createdAt', order = 'DESC' } = req.query;

    const where = { createdById: req.user.id };
    if (status)    where.status   = status;
    if (priority)  where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (search)    where.title = { [Op.like]: `%${search}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const sortCol = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'].includes(sortBy)
      ? sortBy : 'createdAt';

    const { rows: tasks, count: total } = await Task.findAndCountAll({
      where,
      include: taskIncludes,
      order:  [[sortCol, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      offset,
      limit:  parseInt(limit)
    });

    res.json({ success: true, tasks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getTasks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, category, tags,
            projectId, assignedToId, isRecurring, recurringPattern,
            estimatedTime, subtasks } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const task = await Task.create({
      title, description, status, priority, dueDate: dueDate || null,
      category, tags, projectId: projectId || null,
      assignedToId: assignedToId || null, createdById: req.user.id,
      isRecurring, recurringPattern: recurringPattern || null,
      estimatedTime, subtasks: subtasks || []
    });

    await refreshProjectProgress(task.projectId);

    const full = await Task.findByPk(task.id, { include: taskIncludes });
    res.status(201).json({ success: true, task: full });
  } catch (err) {
    console.error('createTask:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, createdById: req.user.id },
      include: [
        ...taskIncludes,
        {
          model: TaskComment, as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
          order:  [['createdAt', 'ASC']]
        }
      ]
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, createdById: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const oldProjectId = task.projectId;

    // Auto-set completedAt
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'completed') {
      req.body.completedAt = null;
    }

    await task.update(req.body);
    await refreshProjectProgress(oldProjectId);
    if (req.body.projectId && req.body.projectId !== oldProjectId) {
      await refreshProjectProgress(req.body.projectId);
    }

    const updated = await Task.findByPk(task.id, { include: taskIncludes });
    res.json({ success: true, task: updated });
  } catch (err) {
    console.error('updateTask:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, createdById: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const projectId = task.projectId;
    await task.destroy();
    await refreshProjectProgress(projectId);

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tasks/:id/comments
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, createdById: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await TaskComment.create({
      text:   req.body.text,
      taskId: task.id,
      userId: req.user.id
    });

    const full = await TaskComment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
    });
    res.status(201).json({ success: true, comment: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/tasks/reorder  — body: { tasks: [{id, status, sortOrder}] }
exports.reorderTasks = async (req, res) => {
  try {
    const updates = (req.body.tasks || []).map(t =>
      Task.update({ status: t.status, sortOrder: t.order }, { where: { id: t.id, createdById: req.user.id } })
    );
    await Promise.all(updates);
    res.json({ success: true, message: 'Tasks reordered' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
