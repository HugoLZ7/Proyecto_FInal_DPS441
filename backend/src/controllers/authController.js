const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const register = async (req, res) => {
  const { nombre, apellido, email, password, carnet } = req.body;

  if (!nombre || !apellido || !email || !password || !carnet) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son requeridos.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres.'
    });
  }

  try {
    const [emailExists] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    );
    if (emailExists.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    const [carnetExists] = await pool.query(
      'SELECT id FROM usuarios WHERE carnet = ?', [carnet]
    );
    if (carnetExists.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Este número de carnet ya está registrado.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, carnet, rol)
       VALUES (?, ?, ?, ?, ?, 'estudiante')`,
      [nombre.trim(), apellido.trim(), email.toLowerCase().trim(), hashedPassword, carnet.trim()]
    );

    const token = jwt.sign(
      { id: result.insertId, email, rol: 'estudiante', nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente.',
      data: {
        token,
        usuario: {
          id: result.insertId,
          nombre,
          apellido,
          email,
          carnet,
          rol: 'estudiante',
        }
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Correo y contraseña son requeridos.'
    });
  }

  try {
    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas.'
      });
    }

    const usuario = users[0];
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas.'
      });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: `Bienvenido, ${usuario.nombre}!`,
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          carnet: usuario.carnet,
          rol: usuario.rol,
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

const verifyMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nombre, apellido, email, carnet, rol FROM usuarios WHERE id = ? AND activo = 1',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    return res.status(200).json({ success: true, data: { usuario: users[0] } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

module.exports = { register, login, verifyMe };