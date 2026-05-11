const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getArticulos, getArticulo, createArticulo,
  updateArticulo, deleteArticulo, getCategorias
} = require('../controllers/articulosController');

router.get('/', verifyToken, getArticulos);
router.get('/categorias', verifyToken, getCategorias);
router.get('/:id', verifyToken, getArticulo);
router.post('/', verifyToken, requireRole('admin'), createArticulo);
router.put('/:id', verifyToken, requireRole('admin'), updateArticulo);
router.delete('/:id', verifyToken, requireRole('admin'), deleteArticulo);

module.exports = router;