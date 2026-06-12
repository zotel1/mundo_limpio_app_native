/**
 * WHAT: Indicador de carga centrado con ActivityIndicator y mensaje opcional.
 * WHY: Consistencia visual en estados de loading de toda la app.
 *      Equivalente a cat_loading_indicator.dart del proyecto Flutter original.
 *      Fácil de reemplazar por animación del gato después sin cambiar la API.
 * BENEFITS: Un solo spinner para toda la app. Si se quiere personalizar
 *           (animación, colores, layout) se hace en un solo lugar.
 *
 * TDD: GREEN — implementación mínima para pasar los tests RED.
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingIndicator({
  message,
  size = 'large',
}: LoadingIndicatorProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={colors.primary}
        testID="loading-indicator"
      />
      {message && (
        <Text style={styles.message} testID="loading-message">
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
