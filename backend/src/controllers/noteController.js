const { Op }  = require('sequelize');
const { Note, Project } = require('../models');

const noteIncludes = [
  { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
];

exports.getNotes = async (req, res) => {
  try {
    const { type, search, isPinned, projectId } = req.query;
    const where = { createdById: req.user.id, isArchived: false };

    if (type)      where.type     = type;
    if (projectId) where.projectId = projectId;
    if (isPinned !== undefined) where.isPinned = isPinned === 'true';
    if (search)    where.title    = { [Op.like]: `%${search}%` };

    const notes = await Note.findAll({
      where,
      include: noteIncludes,
      order: [['isPinned', 'DESC'], ['updatedAt', 'DESC']]
    });

    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content, type, color, tags, isPinned, codeSnippet, links, projectId } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const note = await Note.create({
      title, content, type, color, tags: tags || [],
      isPinned: isPinned || false,
      codeLanguage: codeSnippet?.language || null,
      codeContent:  codeSnippet?.code     || null,
      links: links || [],
      projectId: projectId || null,
      createdById: req.user.id
    });

    const full = await Note.findByPk(note.id, { include: noteIncludes });
    res.status(201).json({ success: true, note: full });
  } catch (err) {
    console.error('createNote:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      where: { id: req.params.id, createdById: req.user.id },
      include: noteIncludes
    });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, createdById: req.user.id } });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const { codeSnippet, ...rest } = req.body;
    const updateData = { ...rest };
    if (codeSnippet) {
      updateData.codeLanguage = codeSnippet.language;
      updateData.codeContent  = codeSnippet.code;
    }

    await note.update(updateData);
    const updated = await Note.findByPk(note.id, { include: noteIncludes });
    res.json({ success: true, note: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, createdById: req.user.id } });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    await note.destroy();
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
