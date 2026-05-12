import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput, Modal, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { articulosAPI } from '../../services/api';

export default function GestionArticulosScreen() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', cantidad_total: '', categoria_id: '1' });

  const loadArticulos = async () => {
    const res = await articulosAPI.getAll();
    if (res.ok) setArticulos(res.data.data);
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { loadArticulos(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); loadArticulos(); }, []);

  const handleCrear = async () => {
    if (!form.nombre || !form.cantidad_total) return Alert.alert('Campos requeridos', 'Nombre y cantidad son obligatorios.');
    const res = await articulosAPI.create({ ...form, cantidad_total: parseInt(form.cantidad_total) });
    if (res.ok) { Alert.alert('Éxito', 'Artículo creado.'); setModalVisible(false); setForm({ nombre: '', descripcion: '', cantidad_total: '', categoria_id: '1' }); loadArticulos(); }
    else Alert.alert('Error', res.data.message);
  };

  const handleEliminar = (id, nombre) => {
    Alert.alert('Descontinuar artículo', `¿Deseas descontinuar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descontinuar', style: 'destructive', onPress: async () => {
        const res = await articulosAPI.delete(id);
        if (res.ok) loadArticulos();
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1a2a1a', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Artículos</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color="#f59e0b" />
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#f59e0b" style={{ marginTop: 40 }} /> :
          articulos.map((art) => (
            <View key={art.id} style={styles.articuloCard}>
              <View style={styles.articuloLeft}>
                <View style={styles.articuloIconWrapper}>
                  <Ionicons name="cube-outline" size={22} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.articuloNombre}>{art.nombre}</Text>
                  <Text style={styles.articuloCategoria}>{art.categoria_nombre}</Text>
                  <Text style={styles.articuloStock}>Stock: {art.cantidad_disponible}/{art.cantidad_total}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleEliminar(art.id, art.nombre)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        }
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo Artículo</Text>
            {[
              { key: 'nombre', placeholder: 'Nombre del artículo' },
              { key: 'descripcion', placeholder: 'Descripción' },
              { key: 'cantidad_total', placeholder: 'Cantidad total', keyboard: 'numeric' },
            ].map((f) => (
              <TextInput
                key={f.key}
                style={styles.modalInput}
                placeholder={f.placeholder}
                placeholderTextColor="#475569"
                value={form[f.key]}
                onChangeText={(val) => setForm(prev => ({ ...prev, [f.key]: val }))}
                keyboardType={f.keyboard || 'default'}
              />
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCrear}>
                <Text style={styles.createText}>Crear</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  addBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  articuloCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(100,116,139,0.15)' },
  articuloLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  articuloIconWrapper: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  articuloNombre: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  articuloCategoria: { fontSize: 12, color: '#64748b', marginTop: 1 },
  articuloStock: { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginBottom: 20 },
  modalInput: { backgroundColor: 'rgba(30,58,95,0.5)', borderRadius: 12, padding: 14, color: '#f1f5f9', fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(100,116,139,0.25)' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(100,116,139,0.2)', alignItems: 'center' },
  cancelText: { color: '#94a3b8', fontWeight: '700' },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b' },
  createText: { color: '#f59e0b', fontWeight: '700' },
});