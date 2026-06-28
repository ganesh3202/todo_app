const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(250),
    allowNull: false,
    validate: { len: [1, 250] }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'todo'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('tags');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('tags', Array.isArray(val) ? JSON.stringify(val) : null);
    }
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: true
  },
  estimatedTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'In minutes'
  },
  actualTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'In minutes'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Stored as JSON strings in TEXT columns
  subtasks: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('subtasks');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('subtasks', val ? JSON.stringify(val) : null);
    }
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('attachments');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('attachments', val ? JSON.stringify(val) : null);
    }
  },
  // FK columns
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'projects', key: 'id' }
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  indexes: [
    { fields: ['createdById', 'status'] },
    { fields: ['projectId'] },
    { fields: ['dueDate'] },
    { fields: ['title'] }
  ]
});

module.exports = Task;
