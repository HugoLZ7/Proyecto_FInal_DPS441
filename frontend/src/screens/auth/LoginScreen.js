import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error de acceso', result.message || 'Credenciales incorrectas.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoWrapper}>
              <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.logoGradient}>
                <Ionicons name="flask" size={38} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>LabControl</Text>
            <Text style={styles.appSubtitle}>Sistema de Inventario de Laboratorio</Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ACCESO</Text>
              <View style={styles.dividerLine} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo institucional</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? '#3b82f6' : '#94a3b8'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="correo@universidad.edu"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#3b82f6' : '#94a3b8'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={loading ? ['#475569', '#475569'] : ['#3b82f6', '#1d4ed8']}
                style={styles.loginBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="#ffffff" size="small" /> : (
                  <>
                    <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.rolesContainer}>
              <Text style={styles.rolesTitle}>Accesos disponibles</Text>
              <View style={styles.rolesRow}>
                {[
                  { icon: 'school-outline', label: 'Estudiante', color: '#22c55e' },
                  { icon: 'shield-checkmark-outline', label: 'Admin', color: '#f59e0b' },
                  { icon: 'construct-outline', label: 'Técnico', color: '#8b5cf6' },
                ].map((rol) => (
                  <View key={rol.label} style={styles.roleBadge}>
                    <Ionicons name={rol.icon} size={14} color={rol.color} />
                    <Text style={[styles.roleLabel, { color: rol.color }]}>{rol.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.registerLinkContainer, { opacity: fadeAnim }]}>
            <Text style={styles.registerText}>¿Eres estudiante nuevo? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Crear cuenta</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
            Universidad • Laboratorio de Ciencias
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  decorCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(59,130,246,0.08)', top: -80, right: -80 },
  decorCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(59,130,246,0.06)', bottom: 100, left: -60 },
  decorCircle3: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(29,78,216,0.1)', top: height * 0.35, right: -30 },
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  logoWrapper: { marginBottom: 16, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
  logoGradient: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 32, fontWeight: '800', color: '#f1f5f9', letterSpacing: 0.5, marginBottom: 4 },
  appSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', letterSpacing: 0.3, marginBottom: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '60%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(100,116,139,0.3)' },
  dividerText: { fontSize: 11, color: '#475569', marginHorizontal: 10, letterSpacing: 2, fontWeight: '700' },
  card: { backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 20 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 12, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,58,95,0.4)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,116,139,0.3)', paddingHorizontal: 14, paddingVertical: 3 },
  inputFocused: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#f1f5f9', paddingVertical: 12 },
  eyeBtn: { padding: 4 },
  loginBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  loginBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 },
  rolesContainer: { marginTop: 24, alignItems: 'center' },
  rolesTitle: { fontSize: 11, color: '#475569', letterSpacing: 1, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  rolesRow: { flexDirection: 'row', gap: 10 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  roleLabel: { fontSize: 11, fontWeight: '600' },
  registerLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { fontSize: 14, color: '#64748b' },
  registerLink: { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
  footer: { textAlign: 'center', color: '#334155', fontSize: 11, marginTop: 32, letterSpacing: 0.5 },
});