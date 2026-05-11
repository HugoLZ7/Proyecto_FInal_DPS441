const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { reportarDano, getMisDanos, getTodosDanos, actualizarEstadoDano } = require('../controllers/danosController');

router.post('/', verifyToken, requireRole('estudiante'), reportarDano);
router.get('/mis-danos', verifyToken, requireRole('estudiante'), getMisDanos);
router.get('/', verifyToken, requireRole('admin', 'tecnico'), getTodosDanos);
router.put('/:id', verifyToken, requireRole('tecnico', 'admin'), actualizarEstadoDano);

module.exports = router;