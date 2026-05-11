const { pool } = require('../config/database');

const solicitarPrestamo = async (req, res) => {
  const { articulos, fecha_devolucion_esperada, proposito } = req.body;

  if (!articulos || articulos.length === 0 || !fecha_devolucion_esperada) {
    return res.status(400).json({ success: false, message: 'Artículos y fecha de devolución son requeridos.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of articulos) {
      const [rows] = await conn.query(
        'SELECT cantidad_disponible, nombre FROM articulos WHERE id = ? AND estado = "disponible"',
        [item.articulo_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Artículo no encontrado.' });
      }
      if (rows[0].cantidad_disponible < item.cantidad) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          message: `Stock insuficiente para: ${rows[0].nombre}. Disponibles: ${rows[0].cantidad_disponible}`
        });
      }
    }

    const [prestamo] = await conn.query(
      `INSERT INTO prestamos (usuario_id, fecha_devolucion_esperada, proposito, estado)
       VALUES (?, ?, ?, 'pendiente')`,
      [req.user.id, fecha_devolucion_esperada, proposito]
    );

    for (const item of articulos) {
      await conn.query(
        'INSERT INTO prestamo_detalles (prestamo_id, articulo_id, cantidad) VALUES (?, ?, ?)',
        [prestamo.insertId, item.articulo_id, item.cantidad]
      );
      await conn.query(
        'UPDATE articulos SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?',
        [item.cantidad, item.articulo_id]
      );
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: 'Solicitud enviada. Pendiente de aprobación.',
      data: { prestamo_id: prestamo.insertId }
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error en préstamo:', error);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  } finally {
    conn.release();
  }
};

const getMisPrestamos = async (req, res) => {
  try {
    const [prestamos] = await pool.query(
      `SELECT p.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'articulo_id', pd.articulo_id,
            'nombre', a.nombre,
            'cantidad', pd.cantidad,
            'cantidad_devuelta', pd.cantidad_devuelta
          )
        ) AS articulos
       FROM prestamos p
       JOIN prestamo_detalles pd ON pd.prestamo_id = p.id
       JOIN articulos a ON a.id = pd.articulo_id
       WHERE p.usuario_id = ?
       GROUP BY p.id
       ORDER BY p.fecha_solicitud DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, data: prestamos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const getTodosPrestamos = async (req, res) => {
  try {
    const { estado } = req.query;
    let query = `
      SELECT p.*,
        CONCAT(u.nombre, ' ', u.apellido) AS estudiante_nombre,
        u.carnet,
        JSON_ARRAYAGG(
          JSON_OBJECT('nombre', a.nombre, 'cantidad', pd.cantidad)
        ) AS articulos
      FROM prestamos p
      JOIN usuarios u ON u.id = p.usuario_id
      JOIN prestamo_detalles pd ON pd.prestamo_id = p.id
      JOIN articulos a ON a.id = pd.articulo_id
    `;
    const params = [];
    if (estado) { query += ' WHERE p.estado = ?'; params.push(estado); }
    query += ' GROUP BY p.id ORDER BY p.fecha_solicitud DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const gestionarPrestamo = async (req, res) => {
  const { estado, observaciones } = req.body;
  const prestamoId = req.params.id;

  if (!['aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ success: false, message: 'Estado inválido.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [prestamo] = await conn.query(
      'SELECT * FROM prestamos WHERE id = ? AND estado = "pendiente"', [prestamoId]
    );
    if (prestamo.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Préstamo no encontrado o ya procesado.' });
    }

    await conn.query(
      'UPDATE prestamos SET estado = ?, aprobado_por = ?, observaciones_admin = ? WHERE id = ?',
      [estado, req.user.id, observaciones, prestamoId]
    );

    if (estado === 'rechazado') {
      const [detalles] = await conn.query(
        'SELECT * FROM prestamo_detalles WHERE prestamo_id = ?', [prestamoId]
      );
      for (const detalle of detalles) {
        await conn.query(
          'UPDATE articulos SET cantidad_disponible = cantidad_disponible + ? WHERE id = ?',
          [detalle.cantidad, detalle.articulo_id]
        );
      }
    }

    await conn.commit();
    return res.status(200).json({ success: true, message: `Préstamo ${estado}.` });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: 'Error interno.' });
  } finally {
    conn.release();
  }
};

const registrarDevolucion = async (req, res) => {
  const prestamoId = req.params.id;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [prestamo] = await conn.query(
      'SELECT * FROM prestamos WHERE id = ? AND estado = "aprobado"', [prestamoId]
    );
    if (prestamo.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Préstamo activo no encontrado.' });
    }

    if (req.user.rol === 'estudiante' && prestamo[0].usuario_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'No autorizado.' });
    }

    const [detalles] = await conn.query(
      'SELECT * FROM prestamo_detalles WHERE prestamo_id = ?', [prestamoId]
    );

    for (const detalle of detalles) {
      // Verificar si este detalle tiene un daño reportado
      const [danoExistente] = await conn.query(
        `SELECT id FROM danos 
         WHERE prestamo_detalle_id = ? 
         AND estado NOT IN ('reparado', 'sin_solucion')`,
        [detalle.id]
      );

      // Si tiene daño activo, NO devolver al stock (el técnico lo maneja)
      if (danoExistente.length > 0) {
        // Solo marcar como devuelto en el detalle sin sumar al stock
        await conn.query(
          'UPDATE prestamo_detalles SET cantidad_devuelta = cantidad WHERE id = ?',
          [detalle.id]
        );
        continue;
      }

      // Sin daño activo: devolver normalmente al stock
      const cantDevolver = detalle.cantidad - detalle.cantidad_devuelta;
      if (cantDevolver > 0) {
        await conn.query(
          'UPDATE articulos SET cantidad_disponible = cantidad_disponible + ? WHERE id = ?',
          [cantDevolver, detalle.articulo_id]
        );
        await conn.query(
          'UPDATE prestamo_detalles SET cantidad_devuelta = cantidad WHERE id = ?',
          [detalle.id]
        );
      }
    }

    await conn.query(
      'UPDATE prestamos SET estado = "devuelto", fecha_devolucion_real = NOW() WHERE id = ?',
      [prestamoId]
    );

    await conn.commit();
    return res.status(200).json({ 
      success: true, 
      message: 'Devolución registrada. Los artículos dañados quedan pendientes con el técnico.' 
    });

  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: 'Error interno.' });
  } finally {
    conn.release();
  }
};

module.exports = { solicitarPrestamo, getMisPrestamos, getTodosPrestamos, gestionarPrestamo, registrarDevolucion };