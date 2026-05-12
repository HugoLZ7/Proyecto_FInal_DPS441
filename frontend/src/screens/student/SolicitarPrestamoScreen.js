import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { articulosAPI, prestamosAPI } from "../../services/api";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function SolicitarPrestamoScreen() {
  const [articulos, setArticulos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [fecha, setFecha] = useState("");
  const [proposito, setProposito] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadArticulos();
  }, []);

  const loadArticulos = async () => {
    setLoading(true);
    const res = await articulosAPI.getAll();
    if (res.ok)
      setArticulos(res.data.data.filter((a) => a.cantidad_disponible > 0));
    setLoading(false);
  };

  const toggleSeleccion = (articulo) => {
    const existe = seleccionados.find((s) => s.articulo_id === articulo.id);
    if (existe) {
      setSeleccionados(
        seleccionados.filter((s) => s.articulo_id !== articulo.id),
      );
    } else {
      setSeleccionados([
        ...seleccionados,
        { articulo_id: articulo.id, cantidad: 1, nombre: articulo.nombre },
      ]);
    }
  };

  const cambiarCantidad = (id, cantidad) => {
    setSeleccionados(
      seleccionados.map((s) =>
        s.articulo_id === id ? { ...s, cantidad: Math.max(1, cantidad) } : s,
      ),
    );
  };

  const handleSolicitar = async () => {
    if (seleccionados.length === 0)
      return Alert.alert("Sin artículos", "Selecciona al menos un artículo.");
    if (!fecha)
      return Alert.alert(
        "Fecha requerida",
        "Ingresa la fecha de devolución (YYYY-MM-DD).",
      );
    if (!proposito.trim())
      return Alert.alert(
        "Propósito requerido",
        "Describe el propósito del préstamo.",
      );

    setSubmitting(true);
    const res = await prestamosAPI.solicitar({
      articulos: seleccionados.map((s) => ({
        articulo_id: s.articulo_id,
        cantidad: s.cantidad,
      })),
      fecha_devolucion_esperada: fecha,
      proposito,
    });
    setSubmitting(false);

    if (res.ok) {
      Alert.alert(
        "¡Solicitud enviada!",
        "Tu solicitud está pendiente de aprobación por el administrador.",
      );
      setSeleccionados([]);
      setFecha("");
      setProposito("");
    } else {
      Alert.alert("Error", res.data.message);
    }
  };

  const articulosFiltrados = articulos.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={["#0f172a", "#1e3a5f", "#0f172a"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Solicitar Préstamo</Text>
        <Text style={styles.pageSubtitle}>
          Selecciona los artículos que necesitas
        </Text>

        {/* Búsqueda */}
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#64748b"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artículo..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Lista de artículos */}
        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 30 }} />
        ) : (
          articulosFiltrados.map((art) => {
            const seleccionado = seleccionados.find(
              (s) => s.articulo_id === art.id,
            );
            return (
              <TouchableOpacity
                key={art.id}
                style={[
                  styles.articuloCard,
                  seleccionado && styles.articuloCardSelected,
                ]}
                onPress={() => toggleSeleccion(art)}
                activeOpacity={0.8}
              >
                <View style={styles.articuloLeft}>
                  <Ionicons
                    name="cube-outline"
                    size={20}
                    color={seleccionado ? "#3b82f6" : "#64748b"}
                  />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.articuloNombre}>{art.nombre}</Text>
                    <Text style={styles.articuloDisp}>
                      {art.cantidad_disponible} disponibles
                    </Text>
                  </View>
                </View>
                {seleccionado ? (
                  <View style={styles.cantidadControl}>
                    <TouchableOpacity
                      onPress={() =>
                        cambiarCantidad(art.id, seleccionado.cantidad - 1)
                      }
                    >
                      <Ionicons
                        name="remove-circle"
                        size={24}
                        color="#3b82f6"
                      />
                    </TouchableOpacity>
                    <Text style={styles.cantidadText}>
                      {seleccionado.cantidad}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        cambiarCantidad(art.id, seleccionado.cantidad + 1)
                      }
                    >
                      <Ionicons name="add-circle" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#475569"
                  />
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* Formulario */}
        {seleccionados.length > 0 && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Detalles del préstamo</Text>

            <Text style={styles.label}>Fecha de devolución</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#64748b"
                style={{ marginRight: 8 }}
              />
              <Text
                style={[styles.input, { color: fecha ? "#f1f5f9" : "#475569" }]}
              >
                {fecha ? fecha : "Selecciona una fecha"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              minimumDate={new Date()}
              onConfirm={(date) => {
                const formatted = date.toISOString().split("T")[0];
                setFecha(formatted);
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
            />

            <Text style={styles.label}>Propósito</Text>
            <View
              style={[
                styles.inputWrapper,
                { alignItems: "flex-start", paddingTop: 10 },
              ]}
            >
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="Describe para qué necesitas los artículos..."
                placeholderTextColor="#475569"
                value={proposito}
                onChangeText={setProposito}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSolicitar}
              disabled={submitting}
            >
              <LinearGradient
                colors={["#3b82f6", "#1d4ed8"]}
                style={styles.submitBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Enviar Solicitud</Text>
                    <Ionicons
                      name="send"
                      size={16}
                      color="#fff"
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 30 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  pageSubtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30,58,95,0.5)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.2)",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#f1f5f9" },
  articuloCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30,58,95,0.4)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.15)",
  },
  articuloCardSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  articuloLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  articuloNombre: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  articuloDisp: { fontSize: 12, color: "#64748b", marginTop: 2 },
  cantidadControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  cantidadText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
    minWidth: 20,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30,58,95,0.5)",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.25)",
  },
  input: { flex: 1, fontSize: 14, color: "#f1f5f9", paddingVertical: 12 },
  submitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
