import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Student
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import SolicitarPrestamoScreen from '../screens/student/SolicitarPrestamoScreen';
import MisPrestamosScreen from '../screens/student/MisPrestamosScreen';
import ReportarDanoScreen from '../screens/student/ReportarDanoScreen';
import HistorialScreen from '../screens/student/HistorialScreen';

// Admin
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import GestionPrestamosScreen from '../screens/admin/GestionPrestamosScreen';
import GestionArticulosScreen from '../screens/admin/GestionArticulosScreen';
import GestionUsuariosScreen from '../screens/admin/GestionUsuariosScreen';

// Tecnico
import TecnicoHomeScreen from '../screens/technician/TecnicoHomeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── TAB ESTUDIANTE ───────────────────────────────────────────────────────────
function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: 'rgba(59,130,246,0.2)',
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#475569',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Inicio: 'home-outline',
            Solicitar: 'add-circle-outline',
            Préstamos: 'library-outline',
            Historial: 'time-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={StudentHomeScreen} />
      <Tab.Screen name="Solicitar" component={SolicitarPrestamoScreen} />
      <Tab.Screen name="Préstamos" component={MisPrestamosScreen} />
      <Tab.Screen name="Historial" component={HistorialScreen} />
    </Tab.Navigator>
  );
}

// ─── TAB ADMIN ────────────────────────────────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: 'rgba(245,158,11,0.2)',
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#475569',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'grid-outline',
            Préstamos: 'clipboard-outline',
            Artículos: 'cube-outline',
            Usuarios: 'people-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminHomeScreen} />
      <Tab.Screen name="Préstamos" component={GestionPrestamosScreen} />
      <Tab.Screen name="Artículos" component={GestionArticulosScreen} />
      <Tab.Screen name="Usuarios" component={GestionUsuariosScreen} />
    </Tab.Navigator>
  );
}

// ─── TAB TÉCNICO ──────────────────────────────────────────────────────────────
function TecnicoTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: 'rgba(139,92,246,0.2)',
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#475569',
      }}
    >
      <Tab.Screen
        name="Daños"
        component={TecnicoHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── NAVEGADOR INTERNO (usa useAuth aquí, ya dentro del AuthProvider) ─────────
function RootNavigator() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!usuario ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : usuario.rol === 'admin' ? (
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      ) : usuario.rol === 'tecnico' ? (
        <Stack.Screen name="TecnicoTabs" component={TecnicoTabs} />
      ) : (
        <>
          <Stack.Screen name="StudentTabs" component={StudentTabs} />
          <Stack.Screen name="ReportarDano" component={ReportarDanoScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ─── NAVIGATOR RAÍZ (NavigationContainer va aquí, SIN useAuth) ────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}