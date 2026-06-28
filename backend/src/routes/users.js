const router = require('express').Router();
const { Op }  = require('sequelize');
const { protect } = require('../middleware/auth');
const { User } = require('../models');

router.use(protect);

// GET /api/users/search?q=...
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ success: true, users: [] });

    const users = await User.findAll({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: req.user.id } },
          {
            [Op.or]: [
              { name:  { [Op.like]: `%${q}%` } },
              { email: { [Op.like]: `%${q}%` } }
            ]
          }
        ]
      },
      attributes: ['id', 'name', 'email', 'avatar'],
      limit: 10
    });

    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
