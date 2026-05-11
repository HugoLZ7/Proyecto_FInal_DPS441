const { pool } = require('../config/database');

const getArticulos = async (req, res) => {
  try {
    const { categoria_id, search } = req.query;
    let query = `
      SELECT a.*, c.nombre AS categoria_nombre 
      FROM articulos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      WHERE a.estado != 'descontinuado'
    `;
    const params = [];

    if (categoria_id) {
      query += ' AND a.categoria_id = ?';
      params.push(categoria_id);
    }
    if (search) {
      query += ' AND (a.nombre LIKE ? OR a.descripcion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY a.nombre ASC';

    const [articulos] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: articulos });
  } catch (error) {
    console.error('Error obteniendo artículos:', error);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const getArticulo = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.nombre AS categoria_nombre 
       FROM articulos a LEFT JOIN categorias c ON a.categoria_id = c.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Artículo no encontrado.' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const createArticulo = async (req, res) => {
  const { nombre, descripcion, categoria_id, cantidad_total, imagen_url } = req.body;
  if (!nombre || !cantidad_total) {
    return res.status(400).json({ success: false, message: 'Nombre y cantidad son requeridos.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO articulos (nombre, descripcion, categoria_id, cantidad_total, cantidad_disponible, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, categoria_id, cantidad_total, cantidad_total, imagen_url]
    );
    return res.status(201).json({ success: true, message: 'Artículo creado.', data: { id: result.insertId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const updateArticulo = async (req, res) => {
  const { nombre, descripcion, categoria_id, cantidad_total, imagen_url, estado } = req.body;
  try {
    await pool.query(
      `UPDATE articulos SET nombre=?, descripcion=?, categoria_id=?, cantidad_total=?, imagen_url=?, estado=?
       WHERE id=?`,
      [nombre, descripcion, categoria_id, cantidad_total, imagen_url, estado, req.params.id]
    );
    return res.status(200).json({ success: true, message: 'Artículo actualizado.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const deleteArticulo = async (req, res) => {
  try {
    await pool.query(
      "UPDATE articulos SET estado = 'descontinuado' WHERE id = ?",
      [req.params.id]
    );
    return res.status(200).json({ success: true, message: 'Artículo descontinuado.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const getCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

module.exports = { getArticulos, getArticulo, createArticulo, updateArticulo, deleteArticulo, getCategorias };