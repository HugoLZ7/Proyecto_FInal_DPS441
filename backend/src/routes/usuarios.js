const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAll, create, update, remove } = require('../controllers/usuariosController');

router.get('/', verifyToken, requireRole('admin'), getAll);
router.post('/', verifyToken, requireRole('admin'), create);
router.put('/:id', verifyToken, requireRole('admin'), update);
router.delete('/:id', verifyToken, requireRole('admin'), remove);

module.exports = router;