const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellido, email, carnet, rol, activo, created_at 
       FROM usuarios 
       WHERE activo = 1
       ORDER BY created_at DESC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const create = async (req, res) => {
  const { nombre, apellido, email, password, carnet, rol } = req.body;
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ success: false, message: 'Campos requeridos incompletos.' });
  }
  try {
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length > 0) {
      return res.status(409).json({ success: false, message: 'El correo ya está registrado.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, carnet, rol) VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, email.toLowerCase(), hashed, carnet || null, rol || 'estudiante']
    );
    return res.status(201).json({ success: true, message: 'Usuario creado.', data: { id: result.insertId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const update = async (req, res) => {
  const { nombre, apellido, email, password, carnet, rol } = req.body;
  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE usuarios SET nombre=?, apellido=?, email=?, password=?, carnet=?, rol=? WHERE id=?',
        [nombre, apellido, email, hashed, carnet, rol, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nombre=?, apellido=?, email=?, carnet=?, rol=? WHERE id=?',
        [nombre, apellido, email, carnet, rol, req.params.id]
      );
    }
    return res.status(200).json({ success: true, message: 'Usuario actualizado.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

const remove = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.params.id;

    // No permitir eliminar al propio admin
    if (parseInt(userId) === req.user.id) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes eliminar tu propia cuenta.' 
      });
    }

    // Soft delete — solo desactivar la cuenta
    await conn.query(
      'UPDATE usuarios SET activo = 0 WHERE id = ?', 
      [userId]
    );

    await conn.commit();
    return res.status(200).json({ 
      success: true, 
      message: 'Usuario desactivado correctamente.' 
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error eliminando usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  } finally {
    conn.release();
  }
};

module.exports = { getAll, create, update, remove };