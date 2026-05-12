import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput,
  Modal, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usuariosAPI } from '../../services/api';

const ROL_CONFIG = {
  estudiante: { color: '#22c55e', icon: 'school-outline' },
  admin: { color: '#f59e0b', icon: 'shield-checkmark-outline' },
  tecnico: { color: '#8b5cf6', icon: 'construct-outline' },
};

export default function GestionUsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', carnet: '', rol: 'estudiante' });

  const loadUsuarios = async () => {
    const res = await usuariosAPI.getAll();
    if (res.ok) setUsuarios(res.data.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadUsuarios(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); loadUsuarios(); }, []);

  const abrirModalNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', apellido: '', email: '', password: '', carnet: '', rol: 'estudiante' });
    setModalVisible(true);
  };

  const abrirModalEditar = (usuario) => {
    setEditando(usuario);
    setForm({ nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, password: '', carnet: usuario.carnet || '', rol: usuario.rol });
    setModalVisible(true);
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.apellido || !form.email) {
      return Alert.alert('Campos requeridos', 'Nombre, apellido y correo son obligatorios.');
    }
    let res;
    if (editando) {
      res = await usuariosAPI.update(editando.id, {
        nombre: form.nombre, apellido: form.apellido,
        email: form.email, rol: form.rol, carnet: form.carnet,
        ...(form.password && { password: form.password }),
      });
    } else {
      if (!form.password) return Alert.alert('Contraseña requerida', 'Ingresa una contraseña.');
      res = await usuariosAPI.create(form);
    }
    if (res.ok) {
      Alert.alert('Éxito', editando ? 'Usuario actualizado.' : 'Usuario creado.');
      setModalVisible(false);
      loadUsuarios();
    } else {
      Alert.alert('Error', res.data.message);
    }
  };

  const handleEliminar = (usuario) => {
    Alert.alert('Eliminar usuario', `¿Deseas eliminar a ${usuario.nombre} ${usuario.apellido}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const res = await usuariosAPI.delete(usuario.id);
        if (res.ok) loadUsuarios();
        else Alert.alert('Error', res.data.message);
      }},
    ]);
  };

  const roles = ['estudiante', 'admin', 'tecnico'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1a2a1a', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>

        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Usuarios</Text>
          <TouchableOpacity style={styles.addBtn} onPress={abrirModalNuevo}>
            <Ionicons name="add" size={22} color="#f59e0b" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#f59e0b" style={{ marginTop: 40 }} />
        ) : usuarios.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color="#334155" />
            <Text style={styles.emptyText}>No hay usuarios registrados</Text>
          </View>
        ) : usuarios.map((u) => {
          const config = ROL_CONFIG[u.rol] || { color: '#64748b', icon: 'person-outline' };
          return (
            <View key={u.id} style={styles.usuarioCard}>
              <View style={[styles.avatarIcon, { backgroundColor: config.color + '22' }]}>
                <Ionicons name={config.icon} size={22} color={config.color} />
              </View>
              <View style={styles.usuarioInfo}>
                <Text style={styles.usuarioNombre}>{u.nombre} {u.apellido}</Text>
                <Text style={styles.usuarioEmail}>{u.email}</Text>
                {u.carnet && <Text style={styles.usuarioCarnet}>Carnet: {u.carnet}</Text>}
                <View style={[styles.rolBadge, { backgroundColor: config.color + '22' }]}>
                  <Text style={[styles.rolText, { color: config.color }]}>{u.rol}</Text>
                </View>
              </View>
              <View style={styles.usuarioActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => abrirModalEditar(u)}>
                  <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleEliminar(u)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal crear/editar */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>

              {[
                { key: 'nombre', placeholder: 'Nombre' },
                { key: 'apellido', placeholder: 'Apellido' },
                { key: 'email', placeholder: 'Correo electrónico' },
                { key: 'carnet', placeholder: 'Carnet (opcional)' },
                { key: 'password', placeholder: editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña' },
              ].map((f) => (
                <TextInput
                  key={f.key}
                  style={styles.modalInput}
                  placeholder={f.placeholder}
                  placeholderTextColor="#475569"
                  value={form[f.key]}
                  onChangeText={(val) => setForm(prev => ({ ...prev, [f.key]: val }))}
                  secureTextEntry={f.key === 'password'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ))}

              <Text style={styles.modalLabel}>Rol del usuario</Text>
              <View style={styles.rolesRow}>
                {roles.map((r) => {
                  const config = ROL_CONFIG[r];
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.rolOption, form.rol === r && { borderColor: config.color, backgroundColor: config.color + '22' }]}
                      onPress={() => setForm(prev => ({ ...prev, rol: r }))}
                    >
                      <Ionicons name={config.icon} size={18} color={form.rol === r ? config.color : '#64748b'} />
                      <Text style={[styles.rolOptionText, form.rol === r && { color: config.color }]}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar}>
                  <Text style={styles.saveText}>{editando ? 'Guardar' : 'Crear'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  addBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#475569', marginTop: 16 },
  usuarioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(100,116,139,0.15)' },
  avatarIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  usuarioInfo: { flex: 1 },
  usuarioNombre: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  usuarioEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  usuarioCarnet: { fontSize: 11, color: '#475569', marginTop: 1 },
  rolBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  rolText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  usuarioActions: { gap: 8 },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginBottom: 20 },
  modalInput: { backgroundColor: 'rgba(30,58,95,0.5)', borderRadius: 12, padding: 14, color: '#f1f5f9', fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(100,116,139,0.25)' },
  modalLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  rolesRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  rolOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(30,58,95,0.5)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  rolOptionText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(100,116,139,0.2)', alignItems: 'center' },
  cancelText: { color: '#94a3b8', fontWeight: '700' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b' },
  saveText: { color: '#f59e0b', fontWeight: '700' },
});