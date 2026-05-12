import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { prestamosAPI } from '../../services/api';

const ESTADO_CONFIG = {
  pendiente: { color: '#f59e0b', icon: 'time-outline', label: 'Pendiente' },
  aprobado: { color: '#22c55e', icon: 'checkmark-circle-outline', label: 'Aprobado' },
  rechazado: { color: '#ef4444', icon: 'close-circle-outline', label: 'Rechazado' },
  devuelto: { color: '#64748b', icon: 'checkmark-done-outline', label: 'Devuelto' },
  vencido: { color: '#f97316', icon: 'alert-circle-outline', label: 'Vencido' },
};

export default function MisPrestamosScreen({ navigation }) {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPrestamos = async () => {
    const res = await prestamosAPI.misPrestamos();
    if (res.ok) setPrestamos(res.data.data.filter(p => p.estado === 'aprobado' || p.estado === 'pendiente'));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadPrestamos(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); loadPrestamos(); }, []);

  const handleDevolver = (id) => {
    Alert.alert('Confirmar devolución', '¿Estás seguro de registrar la devolución de este préstamo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        const res = await prestamosAPI.devolver(id);
        if (res.ok) { Alert.alert('¡Listo!', 'Devolución registrada correctamente.'); loadPrestamos(); }
        else Alert.alert('Error', res.data.message);
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1e3a5f', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <Text style={styles.pageTitle}>Mis Préstamos</Text>
        <Text style={styles.pageSubtitle}>Préstamos activos y pendientes</Text>

        {loading ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} /> :
          prestamos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={60} color="#334155" />
              <Text style={styles.emptyText}>No tienes préstamos activos</Text>
            </View>
          ) : prestamos.map((p) => {
            const config = ESTADO_CONFIG[p.estado];
            const articulos = typeof p.articulos === 'string' ? JSON.parse(p.articulos) : p.articulos;
            return (
              <View key={p.id} style={styles.prestamoCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.estadoBadge, { backgroundColor: config.color + '22' }]}>
                    <Ionicons name={config.icon} size={14} color={config.color} />
                    <Text style={[styles.estadoText, { color: config.color }]}>{config.label}</Text>
                  </View>
                  <Text style={styles.fecha}>{new Date(p.fecha_solicitud).toLocaleDateString()}</Text>
                </View>

                <View style={styles.articulosList}>
                  {articulos?.map((art, i) => (
                    <Text key={i} style={styles.articuloItem}>• {art.nombre} (x{art.cantidad})</Text>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.devolucionText}>
                    <Ionicons name="calendar-outline" size={12} color="#64748b" /> Devolución: {p.fecha_devolucion_esperada}
                  </Text>
                  {p.estado === 'aprobado' && (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.devolverBtn} onPress={() => handleDevolver(p.id)}>
                        <Text style={styles.devolverText}>Devolver</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.danoBtn} onPress={() => navigation.navigate('ReportarDano', { prestamoId: p.id, articulos })}>
                        <Text style={styles.danoText}>Reportar daño</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#475569', marginTop: 16 },
  prestamoCard: { backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  estadoText: { fontSize: 12, fontWeight: '700' },
  fecha: { fontSize: 12, color: '#64748b' },
  articulosList: { marginBottom: 12 },
  articuloItem: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(100,116,139,0.15)', paddingTop: 12 },
  devolucionText: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  devolverBtn: { flex: 1, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  devolverText: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  danoBtn: { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  danoText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
});