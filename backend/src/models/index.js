const sequelize  = require('../config/database');
const User        = require('./User');
const Project     = require('./Project');
const Task        = require('./Task');
const TaskComment = require('./TaskComment');
const Note        = require('./Note');
const Document    = require('./Document');

// ── Associations ─────────────────────────────────────────────────────────────

// User → Projects (owned)
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User → Tasks (created / assigned)
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

// Project → Tasks
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'SET NULL' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Task → Comments
Task.hasMany(TaskComment, { foreignKey: 'taskId', as: 'comments', onDelete: 'CASCADE' });
TaskComment.belongsTo(Task, { foreignKey: 'taskId' });
TaskComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → Notes
User.hasMany(Note, { foreignKey: 'createdById', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
Project.hasMany(Note, { foreignKey: 'projectId', as: 'notes', onDelete: 'SET NULL' });
Note.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// User → Documents
User.hasMany(Document, { foreignKey: 'uploadedById', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });
Project.hasMany(Document, { foreignKey: 'projectId', as: 'documents', onDelete: 'SET NULL' });
Document.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// ── Sync (auto-create / update tables) ───────────────────────────────────────
const syncDatabase = async () => {
  try {
    // alter: true → updates columns safely without dropping data
    await sequelize.sync({ alter: true });
    console.log('✅ All MySQL tables synced');
  } catch (err) {
    console.error('❌ Table sync failed:', err.message);
    throw err;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  User,
  Project,
  Task,
  TaskComment,
  Note,
  Document
};
