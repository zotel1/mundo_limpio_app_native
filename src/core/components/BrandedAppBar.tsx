/**
 * WHAT: AppBar corporativa de MundoLimpio con logo, título y logout opcional.
 * WHY: Consistencia visual en todas las pantallas que usan AppBar.
 *      Equivalente a branded_app_bar.dart del proyecto Flutter original.
 *      Fondo navy (#1A237E), texto blanco, botón Salir condicional.
 * BENEFITS: Un solo componente, cambios de diseño en un lugar.
 *           Cualquier pantalla autenticada puede usarlo sin repetir estilos.
 *
 * TDD: GREEN — implementación mínima para pasar los tests RED.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

interface BrandedAppBarProps {
  title: string;
  onLogout?: () => void;
}

export function BrandedAppBar({ title, onLogout }: BrandedAppBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onLogout && (
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: 50,
  },
  title: {
    ...typography.h2,
    color: colors.textOnPrimary,
  },
  logoutButton: {
    padding: spacing.xs,
  },
  logoutText: {
    ...typography.button,
    fontSize: 14,
  },
});
