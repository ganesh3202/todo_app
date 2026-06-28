const router = require('express').Router();
const c      = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/',           c.getTasks);
router.post('/',          c.createTask);
router.put('/reorder',    c.reorderTasks);
router.get('/:id',        c.getTask);
router.put('/:id',        c.updateTask);
router.delete('/:id',     c.deleteTask);
router.post('/:id/comments', c.addComment);

module.exports = router;
