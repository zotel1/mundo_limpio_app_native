/**
 * WHAT: Banner de error rojo con mensaje, botón Reintentar y botón dismiss (✕).
 * WHY: UI consistente para mostrar errores en cualquier pantalla.
 *      Equivalente a branded_error_banner.dart del proyecto Flutter original.
 *      Mismo diseño: fondo rojo claro, texto rojo oscuro, acciones opcionales.
 * BENEFITS: Reusable en todas las features. Sin duplicar estilos de error.
 *           Si cambia el diseño de errores, se actualiza en un solo lugar.
 *
 * TDD: GREEN — implementación mínima para pasar los tests RED.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.button}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: 8,
  },
  message: {
    ...typography.error,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  buttonText: {
    ...typography.button,
    fontSize: 12,
  },
  dismiss: {
    ...typography.error,
    fontSize: 18,
    paddingLeft: spacing.sm,
  },
});
