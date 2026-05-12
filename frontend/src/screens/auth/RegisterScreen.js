import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* =========================
   COMPONENTE FIELD FUERA
========================= */
const Field = memo(({
  fieldKey, label, icon, placeholder, keyboardType,
  secure, showToggle, onToggle, show,
  value, updateField, focusedField, setFocusedField,
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, focusedField === fieldKey && styles.inputFocused]}>
      <Ionicons
        name={icon}
        size={17}
        color={focusedField === fieldKey ? '#3b82f6' : '#64748b'}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        value={value}
        onChangeText={(val) => updateField(fieldKey, val)}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        secureTextEntry={secure && !show}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          <Ionicons
            name={show ? 'eye-outline' : 'eye-off-outline'}
            size={17}
            color="#64748b"
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
));

/* =========================
   SCREEN
========================= */
export default function RegisterScreen({ navigation }) {
  // ✅ useAuth DENTRO del componente
  const { login } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    carnet: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.carnet.trim() || !form.email.trim()) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }
    if (form.password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);

    const result = await authAPI.register({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      carnet: form.carnet.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    setLoading(false);

    if (result.ok) {
      // Usamos login del contexto para que el navigator redirija automáticamente
      await login(form.email.trim().toLowerCase(), form.password);
    } else {
      Alert.alert('Error en el registro', result.data.message || 'Ocurrió un error inesperado.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View style={styles.headerIconWrapper}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.headerIcon}>
                <Ionicons name="person-add" size={26} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Acceso exclusivo para estudiantes</Text>
          </Animated.View>

          {/* Card formulario */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Sección datos personales */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Datos personales</Text>
            </View>

            <Field
              fieldKey="nombre"
              label="Nombre"
              icon="person-outline"
              placeholder="Tu nombre"
              value={form.nombre}
              updateField={updateField}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
            <Field
              fieldKey="apellido"
              label="Apellido"
              icon="person-outline"
              placeholder="Tu apellido"
              value={form.apellido}
              updateField={updateField}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
            <Field
              fieldKey="carnet"
              label="Número de carnet"
              icon="card-outline"
              placeholder="Ej: UDB2024001"
              value={form.carnet}
              updateField={updateField}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
            <Field
              fieldKey="email"
              label="Correo institucional"
              icon="mail-outline"
              placeholder="correo@universidad.edu"
              keyboardType="email-address"
              value={form.email}
              updateField={updateField}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            {/* Sección seguridad */}
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <View style={[styles.sectionDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.sectionTitle}>Seguridad</Text>
            </View>

            <Field
              fieldKey="password"
              label="Contraseña"
              icon="lock-closed-outline"
              placeholder="Mínimo 6 caracteres"
              secure
              show={showPassword}
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              value={form.password}
              updateField={updateField}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />
            <Field
              fieldKey="confirmPassword"
              label="Confirmar contraseña"
              icon="shield-checkmark-outline"
              placeholder="Repite tu contraseña"
              secure
              show={showConfirm}
              showToggle
              onToggle={() => setShowConfirm(!showConfirm)}
              value={form.confirmPassword}
              updateField={updateField}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            {/* Indicador fortaleza de contraseña */}
            {form.password.length > 0 && (
              <View style={styles.strengthContainer}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[styles.strengthBar, {
                      backgroundColor:
                        form.password.length < 6
                          ? (i <= 1 ? '#ef4444' : 'rgba(255,255,255,0.1)')
                          : form.password.length < 10
                          ? (i <= 2 ? '#f59e0b' : 'rgba(255,255,255,0.1)')
                          : (i <= 3 ? '#22c55e' : 'rgba(255,255,255,0.1)'),
                    }]}
                  />
                ))}
                <Text style={styles.strengthText}>
                  {form.password.length < 6 ? 'Débil' : form.password.length < 10 ? 'Media' : 'Fuerte'}
                </Text>
              </View>
            )}

            {/* Botón registrar */}
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading ? ['#475569', '#475569'] : ['#22c55e', '#16a34a']}
                style={styles.registerBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.registerBtnText}>Crear mi cuenta</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              Al registrarte aceptas las políticas de uso del laboratorio y te comprometes a cuidar el material prestado.
            </Text>
          </Animated.View>

          {/* Link a login */}
          <Animated.View style={[styles.loginLinkContainer, { opacity: fadeAnim }]}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  decorCircle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(34,197,94,0.06)', top: -60, left: -80 },
  decorCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(59,130,246,0.06)', bottom: 80, right: -50 },
  header: { alignItems: 'center', marginBottom: 28 },
  backBtn: { position: 'absolute', left: 0, top: 0, width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerIconWrapper: { marginBottom: 14, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  headerIcon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#f1f5f9', marginBottom: 4, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: '#64748b', letterSpacing: 0.2 },
  card: { backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(34,197,94,0.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 8 },
  sectionTitle: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.8, marginBottom: 7, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,58,95,0.35)', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(100,116,139,0.25)', paddingHorizontal: 13, paddingVertical: 2 },
  inputFocused: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.07)' },
  inputIcon: { marginRight: 9 },
  input: { fontSize: 14, color: '#f1f5f9', paddingVertical: 11 },
  eyeBtn: { padding: 4 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: -4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthText: { fontSize: 10, color: '#64748b', fontWeight: '600', marginLeft: 4 },
  registerBtn: { marginTop: 12, borderRadius: 13, overflow: 'hidden', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  registerBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  registerBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  disclaimer: { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 14, lineHeight: 16 },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: '#64748b' },
  loginLink: { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
});