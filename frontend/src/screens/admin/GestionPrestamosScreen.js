import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { prestamosAPI, danosAPI } from '../../services/api';

export default function GestionPrestamosScreen() {
  const [prestamos, setPrestamos] = useState([]);
  const [danos, setDanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState('pendiente');
  const [tab, setTab] = useState('prestamos');

  const loadData = async () => {
    const [preRes, danRes] = await Promise.all([
      prestamosAPI.todos({ estado: filtro }),
      danosAPI.todos()
    ]);
    if (preRes.ok) setPrestamos(preRes.data.data);
    if (danRes.ok) setDanos(danRes.data.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setLoading(true); loadData(); }, [filtro]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [filtro]);

  const handleGestionar = (id, accion) => {
    Alert.alert(
      `${accion === 'aprobado' ? 'Aprobar' : 'Rechazar'} préstamo`,
      `¿Confirmas ${accion === 'aprobado' ? 'aprobar' : 'rechazar'} esta solicitud?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: async () => {
          const res = await prestamosAPI.gestionar(id, accion, '');
          if (res.ok) { Alert.alert('Listo', `Préstamo ${accion}.`); loadData(); }
          else Alert.alert('Error', res.data.message);
        }},
      ]
    );
  };

  const DANO_CONFIG = {
    reportado: { color: '#f59e0b', label: 'Reportado' },
    pendiente: { color: '#f97316', label: 'Pendiente' },
    en_reparacion: { color: '#3b82f6', label: 'En reparación' },
    reparado: { color: '#22c55e', label: 'Reparado' },
    sin_solucion: { color: '#ef4444', label: 'Sin solución' },
  };

  const filtros = ['pendiente', 'aprobado', 'devuelto', 'rechazado'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1a2a1a', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>

        <Text style={styles.pageTitle}>Gestión</Text>

        {/* Tabs principales */}
        <View style={styles.mainTabs}>
          {[
            { key: 'prestamos', label: '📦 Préstamos', color: '#f59e0b' },
            { key: 'danos', label: '⚠️ Daños', color: '#ef4444' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.mainTab, tab === t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.mainTabText, tab === t.key && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'prestamos' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosRow}>
              {filtros.map((f) => (
                <TouchableOpacity key={f} style={[styles.filtroBtn, filtro === f && styles.filtroBtnActive]} onPress={() => setFiltro(f)}>
                  <Text style={[styles.filtroText, filtro === f && styles.filtroTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? <ActivityIndicator color="#f59e0b" style={{ marginTop: 40 }} /> :
              prestamos.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="clipboard-outline" size={50} color="#334155" />
                  <Text style={styles.emptyText}>Sin préstamos {filtro}s</Text>
                </View>
              ) : prestamos.map((p) => {
                const articulos = typeof p.articulos === 'string' ? JSON.parse(p.articulos) : p.articulos;
                return (
                  <View key={p.id} style={styles.prestamoCard}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.estudianteNombre}>{p.estudiante_nombre}</Text>
                        <Text style={styles.carnet}>Carnet: {p.carnet}</Text>
                      </View>
                      <Text style={styles.fecha}>{new Date(p.fecha_solicitud).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.articulosList}>
                      {articulos?.map((art, i) => (
                        <Text key={i} style={styles.articuloItem}>• {art.nombre} (x{art.cantidad})</Text>
                      ))}
                    </View>
                    <Text style={styles.devolucion}>📅 Devolución: {p.fecha_devolucion_esperada}</Text>
                    {filtro === 'pendiente' && (
                      <View style={styles.actions}>
                        <TouchableOpacity style={styles.aprobarBtn} onPress={() => handleGestionar(p.id, 'aprobado')}>
                          <Ionicons name="checkmark" size={16} color="#22c55e" />
                          <Text style={styles.aprobarText}>Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rechazarBtn} onPress={() => handleGestionar(p.id, 'rechazado')}>
                          <Ionicons name="close" size={16} color="#ef4444" />
                          <Text style={styles.rechazarText}>Rechazar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            }
          </>
        ) : (
          <>
            <Text style={styles.sectionSubtitle}>Todos los artículos dañados reportados</Text>
            {danos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark-outline" size={50} color="#334155" />
                <Text style={styles.emptyText}>Sin daños reportados</Text>
              </View>
            ) : danos.map((d) => {
              const config = DANO_CONFIG[d.estado] || { color: '#64748b', label: d.estado };
              return (
                <View key={d.id} style={[styles.prestamoCard, { borderColor: 'rgba(239,68,68,0.2)' }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.estudianteNombre}>{d.articulo_nombre}</Text>
                      <Text style={styles.carnet}>Por: {d.reportado_por_nombre} — {d.carnet}</Text>
                    </View>
                    <View style={[styles.estadoBadge, { backgroundColor: config.color + '22' }]}>
                      <Text style={[styles.estadoText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.articuloItem}>📋 {d.descripcion}</Text>
                  <Text style={styles.devolucion}>
                    📅 Reportado: {new Date(d.fecha_reporte).toLocaleDateString()}
                  </Text>
                  {d.notas_tecnico && (
                    <Text style={[styles.articuloItem, { color: '#8b5cf6' }]}>
                      🔧 {d.notas_tecnico}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 16 },
  mainTabs: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(100,116,139,0.2)' },
  mainTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  mainTabText: { fontSize: 14, color: '#64748b', fontWeight: '700' },
  sectionSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  filtrosRow: { marginBottom: 20 },
  filtroBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(30,58,95,0.4)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  filtroBtnActive: { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: '#f59e0b' },
  filtroText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  filtroTextActive: { color: '#f59e0b' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#475569', marginTop: 16 },
  prestamoCard: { backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  estudianteNombre: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  carnet: { fontSize: 12, color: '#64748b', marginTop: 2 },
  fecha: { fontSize: 12, color: '#64748b' },
  articulosList: { marginBottom: 8 },
  articuloItem: { fontSize: 13, color: '#94a3b8', marginBottom: 3 },
  devolucion: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  aprobarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  aprobarText: { fontSize: 13, color: '#22c55e', fontWeight: '700' },
  rechazarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  rechazarText: { fontSize: 13, color: '#ef4444', fontWeight: '700' },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  estadoText: { fontSize: 11, fontWeight: '700' },
});