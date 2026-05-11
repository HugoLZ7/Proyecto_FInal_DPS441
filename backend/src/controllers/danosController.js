const { pool } = require('../config/database');

const reportarDano = async (req, res) => {
  const { prestamo_detalle_id, articulo_id, descripcion, foto_url } = req.body;

  if (!prestamo_detalle_id || !articulo_id || !descripcion) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
  }

  try {
    const [detalle] = await pool.query(
      `SELECT pd.* FROM prestamo_detalles pd
       JOIN prestamos p ON p.id = pd.prestamo_id
       WHERE pd.id = ? AND p.usuario_id = ?`,
      [prestamo_detalle_id, req.user.id]
    );
    if (detalle.length === 0) {
      return res.status(403).json({ success: false, message: 'No autorizado o préstamo no encontrado.' });
    }

    const [result] = await pool.query(
      `INSERT INTO danos (prestamo_detalle_id, articulo_id, reportado_por, descripcion, foto_url)
       VALUES (?, ?, ?, ?, ?)`,
      [prestamo_detalle_id, articulo_id, req.user.id, descripcion, foto_url]
    );

    await pool.query(
      'UPDATE articulos SET cantidad_disponible = GREATEST(0, cantidad_disponible - 1) WHERE id = ?',
      [articulo_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Daño reportado correctamente.',
      data: { dano_id: result.insertId }
    });
  } catch (error) {
    console.error('Error reportando daño:', error);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const getMisDanos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, a.nombre AS articulo_nombre
       FROM danos d
       JOIN articulos a ON a.id = d.articulo_id
       WHERE d.reportado_por = ?
       ORDER BY d.fecha_reporte DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const getTodosDanos = async (req, res) => {
  try {
    const { estado } = req.query;
    let query = `
      SELECT d.*,
        a.nombre AS articulo_nombre,
        CONCAT(u.nombre, ' ', u.apellido) AS reportado_por_nombre,
        u.carnet
      FROM danos d
      JOIN articulos a ON a.id = d.articulo_id
      JOIN usuarios u ON u.id = d.reportado_por
    `;
    const params = [];
    if (estado) { query += ' WHERE d.estado = ?'; params.push(estado); }
    query += ' ORDER BY d.fecha_reporte DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const actualizarEstadoDano = async (req, res) => {
  const { estado, notas_tecnico } = req.body;
  const danoId = req.params.id;

  const estadosValidos = ['pendiente', 'en_reparacion', 'reparado', 'sin_solucion'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ success: false, message: 'Estado inválido.' });
  }

  try {
    const fechaResolucion = ['reparado', 'sin_solucion'].includes(estado) ? new Date() : null;

    await pool.query(
      `UPDATE danos 
       SET estado = ?, notas_tecnico = ?, tecnico_id = ?, fecha_resolucion = ?
       WHERE id = ?`,
      [estado, notas_tecnico, req.user.id, fechaResolucion, danoId]
    );

   if (estado === 'reparado') {
  const [dano] = await pool.query('SELECT articulo_id FROM danos WHERE id = ?', [danoId]);
  if (dano.length > 0) {
    await pool.query(
      'UPDATE articulos SET cantidad_disponible = cantidad_disponible + 1 WHERE id = ?',
      [dano[0].articulo_id]
    );
  }
}

if (estado === 'sin_solucion') {
  const [dano] = await pool.query('SELECT articulo_id FROM danos WHERE id = ?', [danoId]);
  if (dano.length > 0) {
    // Reducir cantidad total porque el artículo ya no existe físicamente
    await pool.query(
      `UPDATE articulos 
       SET cantidad_total = GREATEST(0, cantidad_total - 1)
       WHERE id = ?`,
      [dano[0].articulo_id]
    );
  }
}

    return res.status(200).json({ success: true, message: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error('Error actualizando daño:', error);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

module.exports = { reportarDano, getMisDanos, getTodosDanos, actualizarEstadoDano };