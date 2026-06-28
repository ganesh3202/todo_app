const { Op, fn, col, literal } = require('sequelize');
const { Task, Project, Note, sequelize } = require('../models');

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now    = new Date();

    const startOfDay   = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextWeek     = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalTasks, completedTasks, pendingTasks, overdueTasks,
      activeProjects, totalNotes,
      todayCompleted, weekCompleted, monthCompleted,
      upcomingTasks, recentActivity
    ] = await Promise.all([
      Task.count({ where: { createdById: userId } }),
      Task.count({ where: { createdById: userId, status: 'completed' } }),
      Task.count({ where: { createdById: userId, status: { [Op.in]: ['todo', 'in_progress'] } } }),
      Task.count({ where: { createdById: userId, status: { [Op.ne]: 'completed' }, dueDate: { [Op.lt]: now } } }),
      Project.count({ where: { ownerId: userId, status: 'active' } }),
      Note.count({ where: { createdById: userId } }),
      Task.count({ where: { createdById: userId, status: 'completed', completedAt: { [Op.gte]: startOfDay } } }),
      Task.count({ where: { createdById: userId, status: 'completed', completedAt: { [Op.gte]: startOfWeek } } }),
      Task.count({ where: { createdById: userId, status: 'completed', completedAt: { [Op.gte]: startOfMonth } } }),
      Task.findAll({
        where: {
          createdById: userId,
          status:  { [Op.ne]: 'completed' },
          dueDate: { [Op.between]: [now, nextWeek] }
        },
        include: [{ association: 'project', attributes: ['id', 'name', 'color'] }],
        order: [['dueDate', 'ASC']],
        limit: 5
      }),
      Task.findAll({
        where: { createdById: userId },
        include: [{ association: 'project', attributes: ['id', 'name', 'color'] }],
        attributes: ['id', 'title', 'status', 'priority', 'updatedAt'],
        order: [['updatedAt', 'DESC']],
        limit: 10
      })
    ]);

    // Priority breakdown — raw SQL query
    const priorityRows = await sequelize.query(
      `SELECT priority AS _id, COUNT(*) AS count
       FROM tasks WHERE createdById = :userId
       GROUP BY priority`,
      { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
    );
    const priorityStats = priorityRows.map(r => ({ _id: r._id, count: parseInt(r.count) }));

    // Weekly productivity — last 7 days
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d        = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);

      const count = await Task.count({
        where: {
          createdById:  userId,
          status:       'completed',
          completedAt:  { [Op.between]: [dayStart, dayEnd] }
        }
      });
      weeklyData.push({
        date:      dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: count
      });
    }

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalTasks, completedTasks, pendingTasks, overdueTasks,
        activeProjects, totalNotes, completionRate,
        todayCompleted, weekCompleted, monthCompleted
      },
      upcomingTasks,
      recentActivity,
      weeklyData,
      priorityStats
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/calendar
exports.getCalendarEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const y = parseInt(year)  || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth();

    const startDate = new Date(y, m, 1);
    const endDate   = new Date(y, m + 1, 0, 23, 59, 59);

    const tasks = await Task.findAll({
      where: {
        createdById: req.user.id,
        dueDate: { [Op.between]: [startDate, endDate] }
      },
      include: [{ association: 'project', attributes: ['id', 'name', 'color'] }],
      attributes: ['id', 'title', 'status', 'priority', 'dueDate']
    });

    res.json({ success: true, events: tasks });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
