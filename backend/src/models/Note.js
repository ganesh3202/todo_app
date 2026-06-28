const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  content: {
  type: DataTypes.TEXT,
  allowNull: true,
},
  type: {
    type: DataTypes.ENUM('note', 'snippet', 'interview_qa', 'learning', 'resource'),
    defaultValue: 'note'
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#6366f1'
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  codeLanguage: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  codeContent: {
  type: DataTypes.TEXT('long'),
  allowNull: true
},
  links: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const v = this.getDataValue('links');
      return v ? JSON.parse(v) : [];
    },
    set(v) { this.setDataValue('links', v ? JSON.stringify(v) : null); }
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'projects', key: 'id' }
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'notes',
  timestamps: true,
  indexes: [
    { fields: ['createdById'] },
    { fields: ['isPinned'] },
    { fields: ['title'] }
  ]
});

module.exports = Note;
