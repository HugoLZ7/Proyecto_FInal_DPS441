import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { articulosAPI, prestamosAPI } from '../../services/api';

export default function StudentHomeScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const [articulos, setArticulos] = useState([]);
  const [prestamosActivos, setPrestamosActivos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [artRes, preRes] = await Promise.all([articulosAPI.getAll(), prestamosAPI.misPrestamos()]);
    if (artRes.ok) setArticulos(artRes.data.data.slice(0, 4));
    if (preRes.ok) {
      const activos = preRes.data.data.filter(p => p.estado === 'aprobado').length;
      setPrestamosActivos(activos);
    }
    setLoading(false);
  };

  const quickActions = [
    { icon: 'add-circle', label: 'Solicitar\nPréstamo', color: '#3b82f6', screen: 'Solicitar' },
    { icon: 'library', label: 'Mis\nPréstamos', color: '#22c55e', screen: 'Préstamos' },
    { icon: 'time', label: 'Mi\nHistorial', color: '#f59e0b', screen: 'Historial' },
    { icon: 'warning', label: 'Reportar\nDaño', color: '#ef4444', screen: 'ReportarDano' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1e3a5f', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola, {usuario?.nombre}! 👋</Text>
            <Text style={styles.subGreeting}>Carnet: {usuario?.carnet}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Card de resumen */}
        <LinearGradient colors={['#1d4ed8', '#3b82f6']} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View>
            <Text style={styles.summaryLabel}>Préstamos activos</Text>
            <Text style={styles.summaryNumber}>{prestamosActivos}</Text>
          </View>
          <Ionicons name="flask" size={48} color="rgba(255,255,255,0.2)" />
        </LinearGradient>

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Artículos disponibles */}
        <Text style={styles.sectionTitle}>Artículos disponibles</Text>
        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} />
        ) : (
          articulos.map((art) => (
            <View key={art.id} style={styles.articuloCard}>
              <View style={styles.articuloIcon}>
                <Ionicons name="cube-outline" size={22} color="#3b82f6" />
              </View>
              <View style={styles.articuloInfo}>
                <Text style={styles.articuloNombre}>{art.nombre}</Text>
                <Text style={styles.articuloCategoria}>{art.categoria_nombre}</Text>
              </View>
              <View style={[styles.stockBadge, { backgroundColor: art.cantidad_disponible > 0 ? '#22c55e22' : '#ef444422' }]}>
                <Text style={[styles.stockText, { color: art.cantidad_disponible > 0 ? '#22c55e' : '#ef4444' }]}>
                  {art.cantidad_disponible} disp.
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  summaryCard: { borderRadius: 20, padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  summaryNumber: { fontSize: 42, fontWeight: '800', color: '#ffffff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#94a3b8', marginBottom: 14, letterSpacing: 0.5 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: { width: '47%', backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  actionIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 12, color: '#94a3b8', textAlign: 'center', fontWeight: '600' },
  articuloCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(100,116,139,0.15)' },
  articuloIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  articuloInfo: { flex: 1 },
  articuloNombre: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
  articuloCategoria: { fontSize: 12, color: '#64748b', marginTop: 2 },
  stockBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  stockText: { fontSize: 12, fontWeight: '700' },
});