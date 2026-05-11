const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const articulosRoutes = require('./routes/articulos');
const prestamosRoutes = require('./routes/prestamos');
const danosRoutes = require('./routes/danos');
const usuariosRoutes = require('./routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/articulos', articulosRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/danos', danosRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando 🚀' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

start();