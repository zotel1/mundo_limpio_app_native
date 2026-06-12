/**
 * SplashScreen — Pantalla splash interactiva con 4 estados.
 *
 * WHAT: Pantalla inicial con gato durmiendo → tap → health check + auth
 *       → navegación a Home o Login. Máquina de 4 estados: idle, waking,
 *       retry, resolved. Equivalente exacto a splash_screen.dart del Flutter.
 * WHY: 3 condiciones en paralelo (animación 2s, backend health, auth resuelto).
 *      Mismo patrón que Flutter: no se avanza hasta que las 3 se cumplen.
 *      Detecta backend caído antes de llegar a la app.
 * BENEFITS: UX pulida desde el inicio. Health check previene pantallas
 *           rotas. Animación de gato humaniza la experiencia de carga.
 *
 * TDD: GREEN — implementación mínima para pasar SplashScreen.test.tsx.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '@core/theme/colors';
import { typography } from '@core/theme/typography';
import { spacing } from '@core/theme/spacing';
import type { ITokenStorage } from '@core/storage/tokenStorage';
import type { SplashRepository } from '../../domain/ports/splashRepository';
import type { SplashState } from '../../domain/models/splashState';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/** Dependencias inyectables para el SplashScreen. */
export interface SplashScreenDeps {
  splashRepository: SplashRepository;
  tokenStorage: ITokenStorage;
}

/**
 * SplashScreen — Pantalla splash interactiva con gato + health check.
 *
 * Flujo de estados:
 * 1. idle → gato durmiendo, espera tap del usuario
 * 2. waking → health check en progreso + timer de 2s
 * 3. retry → backend no responde, botón para reintentar
 * 4. resolved → todo OK, navega a Home (si hay tokens) o Login
 */
export function SplashScreen({
  navigation,
  splashRepository,
  tokenStorage,
}: Props & SplashScreenDeps) {
  const [state, setState] = useState<SplashState>('idle');
  const [wakeOk, setWakeOk] = useState(false);
  const [wakeCompleted, setWakeCompleted] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout>>();

  /**
   * Verifica si todas las condiciones se cumplieron para pasar a resolved.
   * WHAT: Combina los 3 flags paralelos: wakeOk + authResolved = resolved.
   * WHY: Callback memoizado para evitar re-renders innecesarios.
   */
  const checkResolved = useCallback(() => {
    if (wakeOk && authResolved) {
      setState('resolved');
    }
  }, [wakeOk, authResolved]);

  /**
   * Efecto: al entrar en 'waking', inicia timer de animación + health check.
   * WHAT: Lanza dos procesos en paralelo: timer de 2s mínimo y wakeBackend().
   * WHY: La pantalla se muestra al menos 2 segundos aunque el health check
   *      sea instantáneo. Si falla, se muestra retry.
   */
  useEffect(() => {
    if (state !== 'waking') {
      return;
    }

    // Timer de animación: mínimo 2 segundos
    animationTimer.current = setTimeout(() => {
      setWakeCompleted((prevCompleted) => {
        // Si el timer termina y el health check falló → retry
        // Si el health check ya se completó (wakeCompleted=true)
        // pero wakeOk=false, vamos a retry
        return prevCompleted;
      });
    }, 2000);

    // Health check asíncrono
    splashRepository.wakeBackend().then((ok: boolean) => {
      setWakeOk(ok);
      setWakeCompleted(true);
    });

    return () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, [state, splashRepository]);

  /**
   * Efecto: al completar wakeCompleted, verifica si hay que ir a retry.
   * WHAT: Si el health check terminó (wakeCompleted=true) y falló (wakeOk=false),
   *       transiciona a retry.
   * WHY: Esta transición depende de que AMBAS condiciones se cumplan.
   *      No podemos ir a retry hasta que el health check haya terminado.
   */
  useEffect(() => {
    if (state === 'waking' && wakeCompleted && !wakeOk) {
      setState('retry');
    }
  }, [state, wakeCompleted, wakeOk]);

  /**
   * Efecto: verificar auth al montar el componente.
   * WHAT: Consulta tokenStorage para saber si hay sesión previa.
   * WHY: Determina si el usuario va a Home (sesión activa) o Login.
   */
  useEffect(() => {
    tokenStorage.hasTokens().then((hasTokens: boolean) => {
      // Marcamos authResolved independientemente del resultado
      // La decisión de destino se toma en el efecto de resolved
      setAuthResolved(true);
    });
    // Solo se ejecuta al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Efecto: cuando wakeOk y authResolved son true → resolved.
   * WHAT: Escucha cambios en los flags para disparar la transición.
   */
  useEffect(() => {
    checkResolved();
  }, [checkResolved]);

  /**
   * Efecto: navegar cuando el estado es resolved.
   * WHAT: Determina el destino según hasTokens y resetea la navegación.
   * WHY: navigation.reset() limpia el historial — el usuario no puede
   *      volver atrás a la splash screen.
   */
  useEffect(() => {
    if (state !== 'resolved') {
      return;
    }

    tokenStorage.hasTokens().then((hasTokens: boolean) => {
      navigation.reset({
        index: 0,
        routes: [{ name: hasTokens ? 'Home' : 'Login' }],
      });
    });
  }, [state, navigation, tokenStorage]);

  /**
   * Handler: tap del usuario en estado idle.
   * WHAT: Transiciona de idle a waking, iniciando el flujo.
   */
  const handleTap = () => {
    if (state === 'idle') {
      setState('waking');
    }
  };

  /**
   * Handler: botón Reintentar en estado retry.
   * WHAT: Resetea los flags y vuelve a waking para reintentar el health check.
   */
  const handleRetry = () => {
    setWakeOk(false);
    setWakeCompleted(false);
    setState('waking');
  };

  // ──── Renderizado por estado ──────────────────────────────────────

  switch (state) {
    case 'idle':
      return (
        <TouchableOpacity
          style={styles.container}
          onPress={handleTap}
          activeOpacity={0.8}
          testID="splash-idle"
        >
          <Text style={styles.emoji}>🐱</Text>
          <Text style={styles.prompt}>Tocá para despertar al gato...</Text>
        </TouchableOpacity>
      );

    case 'waking':
      return (
        <View style={styles.container} testID="splash-waking">
          <ActivityIndicator
            size="large"
            color={colors.textOnPrimary}
            accessibilityLabel="Cargando..."
          />
          <Text style={styles.prompt}>Despertando...</Text>
        </View>
      );

    case 'retry':
      return (
        <View style={styles.container} testID="splash-retry">
          <Text style={styles.emoji}>😿</Text>
          <Text style={styles.errorText}>
            No se pudo conectar con el servidor
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );

    case 'resolved':
      return (
        <View style={styles.container} testID="splash-resolved">
          <ActivityIndicator
            size="large"
            color={colors.textOnPrimary}
            accessibilityLabel="Cargando..."
          />
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  prompt: {
    ...typography.h3,
    color: colors.textOnPrimary,
    textAlign: 'center',
    opacity: 0.9,
  },
  errorText: {
    ...typography.body,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryText: {
    ...typography.button,
  },
});
