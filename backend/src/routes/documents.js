const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect } = require('../middleware/auth');
const { Document } = require('../models');

// ── Multer storage config ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },  // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|webp|txt|csv/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

const getType = (mime = '') => {
  if (mime.includes('pdf'))   return 'pdf';
  if (mime.includes('word') || mime.includes('document')) return 'docx';
  if (mime.includes('sheet') || mime.includes('excel'))   return 'xlsx';
  if (mime.includes('image')) return 'image';
  return 'other';
};

router.use(protect);

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const docs = await Document.findAll({
      where: { uploadedById: req.user.id },
      include: [{ association: 'project', attributes: ['id', 'name', 'color'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, documents: docs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/documents  (multipart)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const doc = await Document.create({
      name:         req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      filename:     req.file.filename,
      url:          `/uploads/${req.file.filename}`,
      size:         req.file.size,
      mimetype:     req.file.mimetype,
      type:         getType(req.file.mimetype),
      description:  req.body.description || null,
      tags:         req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
      projectId:    req.body.projectId || null,
      uploadedById: req.user.id
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ where: { id: req.params.id, uploadedById: req.user.id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Delete physical file
    if (doc.filename) {
      const filePath = path.join(__dirname, '../../uploads', doc.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await doc.destroy();
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
