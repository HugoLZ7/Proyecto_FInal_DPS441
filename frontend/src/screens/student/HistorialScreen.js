import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { prestamosAPI, danosAPI } from '../../services/api';

const ESTADO_CONFIG = {
  pendiente: { color: '#f59e0b', label: 'Pendiente' },
  aprobado: { color: '#22c55e', label: 'Aprobado' },
  rechazado: { color: '#ef4444', label: 'Rechazado' },
  devuelto: { color: '#3b82f6', label: 'Devuelto' },
  vencido: { color: '#f97316', label: 'Vencido' },
};

const DANO_CONFIG = {
  reportado: { color: '#f59e0b', label: 'Reportado' },
  pendiente: { color: '#f97316', label: 'Pendiente' },
  en_reparacion: { color: '#3b82f6', label: 'En reparación' },
  reparado: { color: '#22c55e', label: 'Reparado' },
  sin_solucion: { color: '#ef4444', label: 'Sin solución' },
};

export default function HistorialScreen() {
  const [prestamos, setPrestamos] = useState([]);
  const [danos, setDanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('prestamos');

  const loadData = async () => {
    const [preRes, danRes] = await Promise.all([
      prestamosAPI.misPrestamos(),
      danosAPI.misDanos()
    ]);
    if (preRes.ok) setPrestamos(preRes.data.data);
    if (danRes.ok) setDanos(danRes.data.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  const getArticulos = (prestamo) => {
    try {
      return typeof prestamo.articulos === 'string'
        ? JSON.parse(prestamo.articulos)
        : prestamo.articulos || [];
    } catch { return []; }
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
        <Text style={styles.pageTitle}>Mi Historial</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'prestamos', label: '📦 Préstamos' },
            { key: 'danos', label: '⚠️ Daños' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : tab === 'prestamos' ? (
          prestamos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={50} color="#334155" />
              <Text style={styles.emptyText}>Sin historial de préstamos</Text>
            </View>
          ) : prestamos.map((p) => {
            const config = ESTADO_CONFIG[p.estado] || { color: '#64748b', label: p.estado };
            const articulos = getArticulos(p);
            return (
              <View key={p.id} style={styles.historialCard}>
                {/* Header */}
                <View style={styles.cardRow}>
                  <Text style={styles.cardId}>Préstamo #{p.id}</Text>
                  <View style={[styles.badge, { backgroundColor: config.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>

                {/* Artículos */}
                {articulos.length > 0 && (
                  <View style={styles.articulosContainer}>
                    {articulos.map((art, i) => (
                      <Text key={i} style={styles.articuloItem}>
                        • {art.nombre} (x{art.cantidad})
                      </Text>
                    ))}
                  </View>
                )}

                {/* Fechas */}
                <View style={styles.fechasContainer}>
                  <View style={styles.fechaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#64748b" />
                    <Text style={styles.fechaLabel}>Solicitado:</Text>
                    <Text style={styles.fechaValue}>
                      {new Date(p.fecha_solicitud).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.fechaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#64748b" />
                    <Text style={styles.fechaLabel}>Devolución esperada:</Text>
                    <Text style={styles.fechaValue}>{p.fecha_devolucion_esperada}</Text>
                  </View>

                  {p.fecha_devolucion_real && (
                    <View style={styles.fechaRow}>
                      <Ionicons name="checkmark-circle-outline" size={13} color="#22c55e" />
                      <Text style={[styles.fechaLabel, { color: '#22c55e' }]}>Devuelto el:</Text>
                      <Text style={[styles.fechaValue, { color: '#22c55e' }]}>
                        {new Date(p.fecha_devolucion_real).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Propósito */}
                {p.proposito && (
                  <Text style={styles.proposito}>📝 {p.proposito}</Text>
                )}
              </View>
            );
          })
        ) : (
          danos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={50} color="#334155" />
              <Text style={styles.emptyText}>Sin reportes de daños</Text>
            </View>
          ) : danos.map((d) => {
            const config = DANO_CONFIG[d.estado] || { color: '#64748b', label: d.estado };
            return (
              <View key={d.id} style={styles.historialCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardId}>{d.articulo_nombre}</Text>
                  <View style={[styles.badge, { backgroundColor: config.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>
                <View style={styles.fechaRow}>
                  <Ionicons name="calendar-outline" size={13} color="#64748b" />
                  <Text style={styles.fechaLabel}>Reportado:</Text>
                  <Text style={styles.fechaValue}>{new Date(d.fecha_reporte).toLocaleDateString()}</Text>
                </View>
                {d.fecha_resolucion && (
                  <View style={styles.fechaRow}>
                    <Ionicons name="checkmark-circle-outline" size={13} color="#22c55e" />
                    <Text style={[styles.fechaLabel, { color: '#22c55e' }]}>Resuelto:</Text>
                    <Text style={[styles.fechaValue, { color: '#22c55e' }]}>{new Date(d.fecha_resolucion).toLocaleDateString()}</Text>
                  </View>
                )}
                <Text style={styles.proposito}>📋 {d.descripcion}</Text>
                {d.notas_tecnico && (
                  <Text style={styles.tecnicoNota}>🔧 {d.notas_tecnico}</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 20 },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(59,130,246,0.3)' },
  tabText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  tabTextActive: { color: '#3b82f6' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#475569', marginTop: 16 },
  historialCard: { backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(100,116,139,0.15)' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardId: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  articulosContainer: { marginBottom: 10 },
  articuloItem: { fontSize: 13, color: '#94a3b8', marginBottom: 3 },
  fechasContainer: { gap: 6, marginBottom: 8 },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fechaLabel: { fontSize: 12, color: '#64748b' },
  fechaValue: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  proposito: { fontSize: 12, color: '#64748b', marginTop: 6 },
  tecnicoNota: { fontSize: 12, color: '#8b5cf6', marginTop: 4 },
});