const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  solicitarPrestamo, getMisPrestamos, getTodosPrestamos,
  gestionarPrestamo, registrarDevolucion
} = require('../controllers/prestamosController');

router.post('/', verifyToken, requireRole('estudiante'), solicitarPrestamo);
router.get('/mis-prestamos', verifyToken, requireRole('estudiante'), getMisPrestamos);
router.put('/:id/devolver', verifyToken, registrarDevolucion);
router.get('/', verifyToken, requireRole('admin'), getTodosPrestamos);
router.put('/:id/gestionar', verifyToken, requireRole('admin'), gestionarPrestamo);

router.get('/:id/detalles', verifyToken, async (req, res) => {
  const { pool } = require('../config/database');
  try {
    const [rows] = await pool.query(
      `SELECT pd.id as detalle_id, pd.articulo_id, a.nombre, pd.cantidad
       FROM prestamo_detalles pd
       JOIN articulos a ON a.id = pd.articulo_id
       WHERE pd.prestamo_id = ?`,
      [req.params.id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

module.exports = router;