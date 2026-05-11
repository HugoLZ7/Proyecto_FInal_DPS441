import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('usuario');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUsuario(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    if (res.ok) {
      const { token: newToken, usuario: newUser } = res.data.data;
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('usuario', JSON.stringify(newUser));
      setToken(newToken);
      setUsuario(newUser);
      return { success: true, rol: newUser.rol };
    }
    return { success: false, message: res.data.message };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};