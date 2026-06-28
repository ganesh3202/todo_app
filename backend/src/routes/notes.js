const router = require('express').Router();
const c      = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/',       c.getNotes);
router.post('/',      c.createNote);
router.get('/:id',    c.getNote);
router.put('/:id',    c.updateNote);
router.delete('/:id', c.deleteNote);

module.exports = router;
