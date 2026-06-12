/**
 * WHAT: Barra de búsqueda con debounce de 300ms, ícono de lupa a la izquierda
 *       y botón de limpiar (✕) condicional.
 * WHY: Búsqueda local instantánea (spec R2): el usuario escribe y el filtro
 *      se aplica client-side sin llamadas HTTP por keystroke. El debounce
 *      evita re-renders innecesarios del store en cada letra.
 * BENEFITS: Componente reutilizable en cualquier feature. Placeholder
 *           personalizable. Sin dependencia de librerías externas para
 *           el debounce — usa useRef nativo.
 *
 * TDD: GREEN — implementación mínima para pasar los tests RED.
 * PR 2.6 — T023
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';

interface SearchBarProps {
  /** Texto actual del input (controlado desde el store). */
  value: string;
  /** Callback debounced (300ms) que actualiza el store. */
  onChangeText: (text: string) => void;
  /** Placeholder del input (por defecto: "Buscar por nombre o SKU..."). */
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar por nombre o SKU...',
}: SearchBarProps) {
  // Local text for immediate visual feedback — the user sees every keystroke.
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from external value changes (e.g. store reset).
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text);

      // Debounce: cancel previous timer, start new 300ms one.
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChangeText(text);
      }, 300);
    },
    [onChangeText],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChangeText('');
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      {/* Search icon — text character instead of vector icon dependency */}
      <Text style={styles.icon}>🔍</Text>

      <TextInput
        style={styles.input}
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.disabled}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        testID="search-input"
      />

      {/* Clear button — visible only when there's text */}
      {localValue.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          hitSlop={8}
        >
          <Text style={styles.clearButton}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    ...typography.bodySmall,
    fontSize: 18,
    color: colors.textSecondary,
    paddingLeft: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
