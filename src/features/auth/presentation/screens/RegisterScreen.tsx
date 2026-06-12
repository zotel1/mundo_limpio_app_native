/**
 * RegisterScreen — Pantalla de registro de usuario.
 *
 * WHAT: Formulario de registro con email + password + confirmPassword,
 *       validación de fortaleza (≥6 chars, mayúscula, minúscula, dígito)
 *       y mensaje de éxito con redirección a Login.
 *       Equivalente a register_screen.dart del Flutter.
 * WHY: R2.1 — Registro exitoso NO autentica automáticamente.
 *      El usuario debe iniciar sesión después del registro.
 * BENEFITS: Validación completa client-side con Zod, feedback inmediato,
 *           mismas reglas que validators.dart (Flutter).
 *
 * TDD: GREEN — implementación mínima para pasar RegisterScreen.test.tsx.
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
 * WHAT: Schema de validación para registro — mismas reglas que validators.dart.
 * WHY: Zod unifica tipado + validación. Las regex validan fortaleza
 *      de contraseña: ≥6 chars, ≥1 mayúscula, ≥1 minúscula, ≥1 dígito.
 *      El .refine() valida que password y confirmPassword coincidan.
 */
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresá un email válido'),
    password: z
      .string()
      .min(6, 'Mínimo 6 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ──── Props ───────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

// ──── Componente ──────────────────────────────────────────────────────

/**
 * WHAT: Pantalla de Registro con validación de fortaleza de contraseña.
 * WHY: Equivalente a register_screen.dart — R2.1: registro exitoso → login.
 * BENEFITS: Validación completa client-side, feedback inmediato,
 *           mensaje de éxito verde y redirección automática.
 */
export function RegisterScreen({ navigation }: Props) {
  // TODO: Inyectar en composition root
  const tokenStorage = new InMemoryTokenStorage();
  const apiClient = createApiClient();
  const authApi = new AuthApi(apiClient);
  const authRepository = new AuthRepositoryAdapter(authApi, tokenStorage);
  const { register, isLoading, error, clearError } = useAuth({
    authRepository,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  /**
   * WHAT: Handler de submit — valida, limpia errores, ejecuta registro.
   * WHY: El callback onSuccess del register muestra mensaje verde y
   *      redirige a Login después de 1.5s según R2.1.
   */
  const onSubmit = (data: RegisterFormData) => {
    clearError();
    setSuccessMessage(null);
    register(
      { email: data.email.trim(), password: data.password },
      {
        onSuccess: () => {
          setSuccessMessage('¡Registro exitoso! Ahora iniciá sesión.');
          setTimeout(() => navigation.navigate('Login'), 1500);
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Título */}
        <Text style={styles.title}>Registro</Text>
        <Text style={styles.subtitle}>Creá tu cuenta en MundoLimpio</Text>

        {/* Success message */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

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
              placeholder="Al menos 6 caracteres"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              editable={!isLoading}
            />
          )}
        />
        {errors.password ? (
          <Text style={styles.fieldError}>{errors.password.message}</Text>
        ) : (
          <Text style={styles.passwordHint}>
            Mínimo 6 caracteres, una mayúscula, una minúscula y un número
          </Text>
        )}

        {/* Confirm Password */}
        <Text style={styles.label}>Confirmar Contraseña</Text>
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors.confirmPassword && styles.inputError,
              ]}
              placeholder="Repetí tu contraseña"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              editable={!isLoading}
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
        {errors.confirmPassword && (
          <Text style={styles.fieldError}>
            {errors.confirmPassword.message}
          </Text>
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
            <Text style={styles.buttonText}>Crear Cuenta</Text>
          )}
        </TouchableOpacity>

        {/* Link a login */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
        >
          <Text style={styles.link}>¿Ya tenés cuenta? Iniciá Sesión</Text>
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
  passwordHint: {
    ...typography.caption,
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
  successBanner: {
    backgroundColor: '#C8E6C9',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: colors.success,
    textAlign: 'center',
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
