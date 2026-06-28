// routes/dashboard.js
const router = require('express').Router();
const { getStats, getCalendarEvents } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats',    getStats);
router.get('/calendar', getCalendarEvents);

module.exports = router;
