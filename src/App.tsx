/**
 * App.tsx — Componente raíz de MundoLimpio.
 *
 * WHAT: Punto de entrada React de la aplicación. En esta fase (scaffold)
 *       renderiza un placeholder mínimo que será reemplazado en Fase 1.
 * WHY: Necesitamos un componente raíz funcional para que el entry point
 *      (index.js) pueda registrar la app y verificar que RN compila.
 * BENEFITS: Permite validar que el toolchain (tsc, metro, RN) funciona
 *           antes de agregar features complejas.
 */
import React from 'react';
import {SafeAreaView, Text, StyleSheet} from 'react-native';

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>MundoLimpio</Text>
      <Text style={styles.subtitle}>Scaffold inicial — Fase 0</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
});

export default App;
