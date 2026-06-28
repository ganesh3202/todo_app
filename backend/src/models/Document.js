const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'File size in bytes'
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('pdf', 'docx', 'xlsx', 'image', 'other'),
    defaultValue: 'other'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const v = this.getDataValue('tags');
      return v ? JSON.parse(v) : [];
    },
    set(v) { this.setDataValue('tags', v ? JSON.stringify(v) : null); }
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'projects', key: 'id' }
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tasks', key: 'id' }
  },
  uploadedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'documents',
  timestamps: true
});

module.exports = Document;
