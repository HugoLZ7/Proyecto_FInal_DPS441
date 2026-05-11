import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Cambia esta URL por la IP de tu máquina cuando pruebes en dispositivo físico
// Para emulador Android: http://10.0.2.2:3000/api
// Para dispositivo físico: http://TU_IP_LOCAL:3000/api
const BASE_URL = 'http://10.0.2.2:3000/api';

// ─── HELPER ──────────────────────────────────────────────────────────────────
const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

const request = async (endpoint, options = {}) => {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { message: 'Error de conexión con el servidor.' } };
  }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  me: () => request('/auth/me'),
};

// ─── ARTÍCULOS ────────────────────────────────────────────────────────────────
export const articulosAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/articulos${query ? '?' + query : ''}`);
  },
  getOne: (id) => request(`/articulos/${id}`),
  getCategorias: () => request('/articulos/categorias'),
  create: (data) => request('/articulos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/articulos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/articulos/${id}`, { method: 'DELETE' }),
};

// ─── PRÉSTAMOS ────────────────────────────────────────────────────────────────
export const prestamosAPI = {
  solicitar: (data) => request('/prestamos', { method: 'POST', body: JSON.stringify(data) }),
  misPrestamos: () => request('/prestamos/mis-prestamos'),
  todos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/prestamos${query ? '?' + query : ''}`);
  },
  gestionar: (id, estado, observaciones) =>
    request(`/prestamos/${id}/gestionar`, {
      method: 'PUT',
      body: JSON.stringify({ estado, observaciones }),
    }),
  devolver: (id, observaciones) =>
    request(`/prestamos/${id}/devolver`, {
      method: 'PUT',
      body: JSON.stringify({ observaciones }),
    }),
};

// ─── DAÑOS ────────────────────────────────────────────────────────────────────
export const danosAPI = {
  reportar: (data) => request('/danos', { method: 'POST', body: JSON.stringify(data) }),
  misDanos: () => request('/danos/mis-danos'),
  todos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/danos${query ? '?' + query : ''}`);
  },
  actualizarEstado: (id, estado, notas) =>
    request(`/danos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado, notas_tecnico: notas }),
    }),
};

export const usuariosAPI = {
  getAll: () => request('/usuarios'),
  create: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
};