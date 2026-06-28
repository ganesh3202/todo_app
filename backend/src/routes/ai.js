
// routes/ai.js
const router = require('express').Router();
const { aiQuery } = require('../controllers/aiController');
const { protect }  = require('../middleware/auth');

router.use(protect);
router.post('/query', aiQuery);

module.exports = router;
