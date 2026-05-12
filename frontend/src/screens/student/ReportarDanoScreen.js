import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { danosAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:3000/api'; // Ajusta si usas iPhone

export default function ReportarDanoScreen({ route, navigation }) {
  const [prestamos, setPrestamos] = useState([]);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrestamos();
  }, []);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchConToken = async (endpoint) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  };

  const loadPrestamos = async () => {
    try {
      const data = await fetchConToken('/prestamos/mis-prestamos');
      if (data.success) {
        const aprobados = data.data.filter(p => p.estado === 'aprobado');
        setPrestamos(aprobados);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los préstamos.');
    }
    setLoading(false);
  };

  const seleccionarPrestamo = async (prestamo) => {
    setPrestamoSeleccionado(prestamo);
    setArticuloSeleccionado(null);
    setDetalles([]);

    try {
      // Obtener detalles reales del préstamo con detalle_id
      const data = await fetchConToken(`/prestamos/${prestamo.id}/detalles`);
      if (data.success) {
        setDetalles(data.data);
      } else {
        // Fallback: parsear artículos del préstamo
        const arts = typeof prestamo.articulos === 'string'
          ? JSON.parse(prestamo.articulos)
          : prestamo.articulos || [];
        setDetalles(arts);
      }
    } catch (e) {
      // Fallback si el endpoint no existe aún
      const arts = typeof prestamo.articulos === 'string'
        ? JSON.parse(prestamo.articulos)
        : prestamo.articulos || [];
      setDetalles(arts);
    }
  };

  const handleReportar = async () => {
    if (!prestamoSeleccionado) {
      return Alert.alert('Requerido', 'Selecciona el préstamo.');
    }
    if (!articuloSeleccionado) {
      return Alert.alert('Requerido', 'Selecciona el artículo dañado.');
    }
    if (!descripcion.trim()) {
      return Alert.alert('Requerido', 'Escribe una descripción del daño.');
    }

    setSubmitting(true);

    try {
      const token = await getToken();

      // Construir body — usamos detalle_id si existe, sino buscamos por articulo_id
      const body = {
        articulo_id: articuloSeleccionado.articulo_id,
        descripcion: descripcion.trim(),
        prestamo_id: prestamoSeleccionado.id,
      };

      // Si tenemos detalle_id lo incluimos
      if (articuloSeleccionado.detalle_id || articuloSeleccionado.id) {
        body.prestamo_detalle_id = articuloSeleccionado.detalle_id || articuloSeleccionado.id;
      }

      const response = await fetch(`${BASE_URL}/danos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setSubmitting(false);

      if (data.success) {
        Alert.alert(
          '✅ Daño reportado',
          'El reporte fue enviado al técnico de laboratorio.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', data.message || 'No se pudo enviar el reporte.');
      }
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Error', 'Error de conexión con el servidor.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1e3a5f', '#0f172a']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.warningIcon}>
          <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.iconGradient}>
            <Ionicons name="warning" size={32} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.pageTitle}>Reportar Daño</Text>
        <Text style={styles.pageSubtitle}>Selecciona el préstamo y artículo afectado</Text>

        {loading ? (
          <ActivityIndicator color="#ef4444" style={{ marginTop: 40 }} />
        ) : prestamos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#334155" />
            <Text style={styles.emptyText}>No tienes préstamos activos para reportar daños</Text>
          </View>
        ) : (
          <View style={styles.card}>

            {/* PASO 1 */}
            <Text style={styles.sectionLabel}>1. Selecciona el préstamo</Text>
            {prestamos.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.opcionCard, prestamoSeleccionado?.id === p.id && styles.opcionSeleccionada]}
                onPress={() => seleccionarPrestamo(p)}
              >
                <Ionicons
                  name="library-outline"
                  size={18}
                  color={prestamoSeleccionado?.id === p.id ? '#ef4444' : '#64748b'}
                />
                <Text style={[styles.opcionText, prestamoSeleccionado?.id === p.id && { color: '#ef4444' }]}>
                  Préstamo #{p.id} — {new Date(p.fecha_solicitud).toLocaleDateString()}
                </Text>
                {prestamoSeleccionado?.id === p.id && (
                  <Ionicons name="checkmark-circle" size={18} color="#ef4444" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}

            {/* PASO 2 */}
            {prestamoSeleccionado && detalles.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>2. Artículo dañado</Text>
                {detalles.map((art, i) => {
                  const artId = art.articulo_id;
                  const artNombre = art.nombre;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.opcionCard,
                        articuloSeleccionado?.articulo_id === artId && styles.opcionSeleccionada
                      ]}
                      onPress={() => setArticuloSeleccionado(art)}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={18}
                        color={articuloSeleccionado?.articulo_id === artId ? '#ef4444' : '#64748b'}
                      />
                      <Text style={[
                        styles.opcionText,
                        articuloSeleccionado?.articulo_id === artId && { color: '#ef4444' }
                      ]}>
                        {artNombre}
                      </Text>
                      {articuloSeleccionado?.articulo_id === artId && (
                        <Ionicons name="checkmark-circle" size={18} color="#ef4444" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* PASO 3 */}
            {articuloSeleccionado && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>3. Descripción del daño</Text>
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe detalladamente qué ocurrió..."
                    placeholderTextColor="#475569"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleReportar} disabled={submitting}>
                  <LinearGradient
                    colors={['#ef4444', '#b91c1c']}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>Enviar Reporte</Text>
                        <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  warningIcon: { alignItems: 'center', marginBottom: 16 },
  iconGradient: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', marginBottom: 4, textAlign: 'center' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#475569', marginTop: 16, textAlign: 'center' },
  card: { backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  sectionLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  opcionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  opcionSeleccionada: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  opcionText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', flex: 1 },
  textAreaWrapper: { backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)', marginBottom: 16 },
  textArea: { fontSize: 14, color: '#f1f5f9', minHeight: 100 },
  submitBtn: { borderRadius: 14, overflow: 'hidden' },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});