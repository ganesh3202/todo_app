const router = require('express').Router();
const c      = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/',       c.getProjects);
router.post('/',      c.createProject);
router.get('/:id',    c.getProject);
router.put('/:id',    c.updateProject);
router.delete('/:id', c.deleteProject);

module.exports = router;
