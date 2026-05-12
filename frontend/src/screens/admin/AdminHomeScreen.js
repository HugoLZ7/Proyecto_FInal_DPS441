import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { articulosAPI, prestamosAPI, danosAPI } from '../../services/api';

export default function AdminHomeScreen() {
  const { usuario, logout } = useAuth();
  const [stats, setStats] = useState({ articulos: 0, pendientes: 0, activos: 0, danos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const [artRes, preRes, danRes] = await Promise.all([
      articulosAPI.getAll(), prestamosAPI.todos(), danosAPI.todos()
    ]);
    setStats({
      articulos: artRes.ok ? artRes.data.data.length : 0,
      pendientes: preRes.ok ? preRes.data.data.filter(p => p.estado === 'pendiente').length : 0,
      activos: preRes.ok ? preRes.data.data.filter(p => p.estado === 'aprobado').length : 0,
      danos: danRes.ok ? danRes.data.data.filter(d => d.estado !== 'reparado' && d.estado !== 'sin_solucion').length : 0,
    });
    setLoading(false);
  };

  const statCards = [
    { label: 'Artículos', value: stats.articulos, icon: 'cube', color: '#3b82f6' },
    { label: 'Pendientes', value: stats.pendientes, icon: 'time', color: '#f59e0b' },
    { label: 'Préstamos activos', value: stats.activos, icon: 'library', color: '#22c55e' },
    { label: 'Daños activos', value: stats.danos, icon: 'warning', color: '#ef4444' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1a2a1a', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Panel Admin 🛡️</Text>
            <Text style={styles.subGreeting}>{usuario?.nombre} {usuario?.apellido}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#92400e', '#f59e0b']} style={styles.welcomeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.welcomeTitle}>Centro de control</Text>
          <Text style={styles.welcomeSub}>Gestiona inventario, préstamos y usuarios</Text>
          <Ionicons name="shield-checkmark" size={50} color="rgba(255,255,255,0.2)" style={styles.welcomeIcon} />
        </LinearGradient>

        <Text style={styles.sectionTitle}>Resumen del sistema</Text>
        {loading ? <ActivityIndicator color="#f59e0b" /> : (
          <View style={styles.statsGrid}>
            {statCards.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={24} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
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
  welcomeCard: { borderRadius: 20, padding: 24, marginBottom: 28, overflow: 'hidden' },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  welcomeSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  welcomeIcon: { position: 'absolute', right: 16, bottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#94a3b8', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  statIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 32, fontWeight: '800', color: '#f1f5f9' },
  statLabel: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
});