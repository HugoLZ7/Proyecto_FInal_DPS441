import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput, Modal, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { danosAPI } from '../../services/api';

const ESTADOS = [
  { key: 'pendiente', label: 'Pendiente', color: '#f59e0b', icon: 'time-outline' },
  { key: 'en_reparacion', label: 'En reparación', color: '#3b82f6', icon: 'construct-outline' },
  { key: 'reparado', label: 'Reparado', color: '#22c55e', icon: 'checkmark-circle-outline' },
  { key: 'sin_solucion', label: 'Sin solución', color: '#ef4444', icon: 'close-circle-outline' },
];

export default function TecnicoHomeScreen() {
  const { usuario, logout } = useAuth();
  const [danos, setDanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState('reportado');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDano, setSelectedDano] = useState(null);
  const [notas, setNotas] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');

  const loadDanos = async () => {
    const res = await danosAPI.todos(filtro !== 'todos' ? { estado: filtro } : {});
    if (res.ok) setDanos(res.data.data);
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { setLoading(true); loadDanos(); }, [filtro]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadDanos(); }, [filtro]);

  const abrirModal = (dano) => {
    setSelectedDano(dano);
    setNotas(dano.notas_tecnico || '');
    setNuevoEstado('');
    setModalVisible(true);
  };

  const handleActualizar = async () => {
    if (!nuevoEstado) return Alert.alert('Selecciona un estado', 'Debes elegir el nuevo estado del artículo.');
    const res = await danosAPI.actualizarEstado(selectedDano.id, nuevoEstado, notas);
    if (res.ok) {
      Alert.alert('Actualizado', 'Estado del daño actualizado correctamente.');
      setModalVisible(false);
      loadDanos();
    } else Alert.alert('Error', res.data.message);
  };

  const filtros = ['reportado', 'pendiente', 'en_reparacion', 'reparado', 'sin_solucion'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1a0a2e', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Panel Técnico 🔧</Text>
            <Text style={styles.subGreeting}>{usuario?.nombre} {usuario?.apellido}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#4c1d95', '#8b5cf6']} style={styles.welcomeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.welcomeTitle}>Gestión de Reparaciones</Text>
          <Text style={styles.welcomeSub}>Revisa y actualiza el estado de los artículos dañados</Text>
          <Ionicons name="construct" size={50} color="rgba(255,255,255,0.2)" style={styles.welcomeIcon} />
        </LinearGradient>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosRow}>
          {filtros.map((f) => (
            <TouchableOpacity key={f} style={[styles.filtroBtn, filtro === f && styles.filtroBtnActive]} onPress={() => setFiltro(f)}>
              <Text style={[styles.filtroText, filtro === f && styles.filtroTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color="#8b5cf6" style={{ marginTop: 40 }} /> :
          danos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={60} color="#334155" />
              <Text style={styles.emptyText}>Sin artículos en este estado</Text>
            </View>
          ) : danos.map((d) => (
            <TouchableOpacity key={d.id} style={styles.danoCard} onPress={() => abrirModal(d)} activeOpacity={0.8}>
              <View style={styles.danoHeader}>
                <View style={styles.danoIconWrapper}>
                  <Ionicons name="cube-outline" size={22} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.articuloNombre}>{d.articulo_nombre}</Text>
                  <Text style={styles.reportadoPor}>Reportado por: {d.reportado_por_nombre}</Text>
                  <Text style={styles.carnet}>Carnet: {d.carnet}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#475569" />
              </View>
              <Text style={styles.descripcion}>{d.descripcion}</Text>
              <View style={styles.danoFooter}>
                <Text style={styles.fecha}>{new Date(d.fecha_reporte).toLocaleDateString()}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: (ESTADOS.find(e => e.key === d.estado)?.color || '#64748b') + '22' }]}>
                  <Text style={[styles.estadoText, { color: ESTADOS.find(e => e.key === d.estado)?.color || '#64748b' }]}>{d.estado.replace('_', ' ')}</Text>
                </View>
              </View>
              {d.notas_tecnico && <Text style={styles.notasTecnico}>🔧 {d.notas_tecnico}</Text>}
            </TouchableOpacity>
          ))
        }
      </ScrollView>

      {/* Modal para actualizar estado */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedDano?.articulo_nombre}</Text>
            <Text style={styles.modalSubtitle}>{selectedDano?.descripcion}</Text>

            <Text style={styles.modalLabel}>Nuevo estado</Text>
            <View style={styles.estadosGrid}>
              {ESTADOS.map((e) => (
                <TouchableOpacity
                  key={e.key}
                  style={[styles.estadoOption, nuevoEstado === e.key && { borderColor: e.color, backgroundColor: e.color + '22' }]}
                  onPress={() => setNuevoEstado(e.key)}
                >
                  <Ionicons name={e.icon} size={20} color={nuevoEstado === e.key ? e.color : '#64748b'} />
                  <Text style={[styles.estadoOptionText, nuevoEstado === e.key && { color: e.color }]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Notas técnicas</Text>
            <TextInput
              style={styles.notasInput}
              placeholder="Describe qué se hizo o por qué no tiene solución..."
              placeholderTextColor="#475569"
              value={notas}
              onChangeText={setNotas}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.updateBtn} onPress={handleActualizar}>
                <Text style={styles.updateText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  subGreeting: { fontSize: 13, color: '#64748b', marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  welcomeCard: { borderRadius: 20, padding: 24, marginBottom: 24, overflow: 'hidden' },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  welcomeSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  welcomeIcon: { position: 'absolute', right: 16, bottom: 8 },
  filtrosRow: { marginBottom: 20 },
  filtroBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(30,58,95,0.4)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  filtroBtnActive: { backgroundColor: 'rgba(139,92,246,0.2)', borderColor: '#8b5cf6' },
  filtroText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filtroTextActive: { color: '#8b5cf6' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#475569', marginTop: 16 },
  danoCard: { backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)' },
  danoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  danoIconWrapper: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  articuloNombre: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  reportadoPor: { fontSize: 12, color: '#64748b', marginTop: 1 },
  carnet: { fontSize: 11, color: '#475569' },
  descripcion: { fontSize: 13, color: '#94a3b8', marginBottom: 10, lineHeight: 18 },
  danoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontSize: 12, color: '#475569' },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  estadoText: { fontSize: 11, fontWeight: '700' },
  notasTecnico: { fontSize: 12, color: '#8b5cf6', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  modalLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  estadosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  estadoOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(30,58,95,0.5)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  estadoOptionText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  notasInput: { backgroundColor: 'rgba(30,58,95,0.5)', borderRadius: 12, padding: 12, color: '#f1f5f9', fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: 'rgba(100,116,139,0.25)', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(100,116,139,0.2)', alignItems: 'center' },
  cancelText: { color: '#94a3b8', fontWeight: '700' },
  updateBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.2)', alignItems: 'center', borderWidth: 1, borderColor: '#8b5cf6' },
  updateText: { color: '#8b5cf6', fontWeight: '700' },
});