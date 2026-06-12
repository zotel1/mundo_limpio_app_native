/**
 * LoginScreen — Pantalla de inicio de sesión.
 *
 * WHAT: Formulario de login con email + password, validación Zod,
 *       estados visuales (loading, error) y redirección a Home.
 *       Equivalente a login_screen.dart del Flutter.
 * WHY: Punto de entrada para usuarios registrados. React Hook Form
 *      + Zod dan validación tipada sin código manual.
 * BENEFITS: UX completa (spinner, error banner, redirección),
 *           validación client-side inmediata, sin magic strings.
 *
 * TDD: GREEN — implementación mínima para pasar LoginScreen.test.tsx.
 *
 * NOTA: Las dependencias (AuthRepository) se instancian temporalmente aquí.
 *       En el PR de composition root se refactoriza con inyección de dependencias.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { AuthRepositoryAdapter } from '../../infrastructure/adapters/authRepositoryAdapter';
import { AuthApi } from '../../infrastructure/api/authApi';
import { createApiClient } from '@core/http/apiClient';
import { InMemoryTokenStorage } from '@core/storage/tokenStorage';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@core/navigation/types';

// ──── Schema Zod ──────────────────────────────────────────────────────

/**
 * WHAT: Schema de validación para formulario de login.
 * WHY: Zod valida tipado y reglas de negocio en una sola definición.
 *      Sin código manual de validación disperso en el componente.
 *      Las mismas reglas que validators.dart del Flutter.
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresá un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ──── Props ───────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ──── Componente ──────────────────────────────────────────────────────

/**
 * WHAT: Pantalla de Login con formulario validado por Zod.
 * WHY: Equivalente a login_screen.dart — email + password + validación + estados.
 * BENEFITS: React Hook Form + Zod = validación tipada sin código manual.
 */
export function LoginScreen({ navigation }: Props) {
  // TODO: En PR de composition root, estas dependencias se inyectan
  const tokenStorage = new InMemoryTokenStorage();
  const apiClient = createApiClient();
  const authApi = new AuthApi(apiClient);
  const authRepository = new AuthRepositoryAdapter(authApi, tokenStorage);
  const { login, isLoading, error, clearError, status } = useAuth({
    authRepository,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  /**
   * WHAT: Handler de submit — valida, limpia error previo, ejecuta login.
   * WHY: El trim() previene espacios accidentales. clearError()
   *      limpia el banner de error de un intento anterior.
   */
  const onSubmit = (data: LoginFormData) => {
    clearError();
    login({ email: data.email.trim(), password: data.password });
  };

  /**
   * WHAT: Efecto de redirección post-login exitoso.
   * WHY: Cuando el store cambia a 'authenticated', redirigimos a Home
   *      con reset (sin back stack) para que el usuario no pueda
   *      volver atrás al login.
   */
  React.useEffect(() => {
    if (status === 'authenticated') {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [status, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Título */}
        <Text style={styles.title}>MundoLimpio</Text>
        <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="usuario@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              editable={!isLoading}
            />
          )}
        />
        {errors.email && (
          <Text style={styles.fieldError}>{errors.email.message}</Text>
        )}

        {/* Password */}
        <Text style={styles.label}>Contraseña</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Tu contraseña"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              editable={!isLoading}
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
        {errors.password && (
          <Text style={styles.fieldError}>{errors.password.message}</Text>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator
              color={colors.textOnPrimary}
              size="small"
              accessibilityLabel="Cargando..."
            />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {/* Link a registro */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          disabled={isLoading}
        >
          <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ──── Estilos ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    ...typography.error,
    marginTop: spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.error,
    flex: 1,
  },
  errorDismiss: {
    ...typography.error,
    fontSize: 18,
    paddingLeft: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
  },
  link: {
    ...typography.bodySmall,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
