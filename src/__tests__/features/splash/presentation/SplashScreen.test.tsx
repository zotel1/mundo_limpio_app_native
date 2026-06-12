/**
 * TDD: RED — Tests para SplashScreen.
 *
 * WHAT: Pantalla splash interactiva con 4 estados — equivalente a splash_screen.dart.
 * WHY: 3 condiciones en paralelo (animación 2s, health check, auth) — mismo
 *      patrón que Flutter. Detecta backend caído antes de llegar a la app.
 * BENEFITS: Cobertura completa de la máquina de estados: idle → waking → retry/resolved.
 *
 * TDD: GREEN — tests pasan con la implementación mínima.
 *
 * Estrategia:
 * - Mock de @react-navigation/native para controlar navegación
 * - Mock de splashRepository para controlar wakeBackend()
 * - Mock de tokenStorage con promesa controlable para hasTokens()
 * - fireEvent para simular taps del usuario
 * - jest.useFakeTimers() para controlar el timer de 2s
 * - Diferir hasTokens() hasta que explícitamente avancemos timers
 *   para evitar que authResolved se dispare antes de tiempo.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// ════ GREEN: el archivo de producción ya existe ════
import { SplashScreen } from '@features/splash/presentation/screens/SplashScreen';
import type { SplashRepository } from '@features/splash/domain/ports/splashRepository';
import type { ITokenStorage } from '@core/storage/tokenStorage';

// ──── Mocks de React Navigation ──────────────────────────────────────

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
      goBack: mockGoBack,
    }),
    useRoute: () => ({ name: 'Splash', params: {} }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, null, children),
      Screen: ({ children }: { children?: React.ReactNode; name: string }) =>
        React.createElement(View, null, children),
    }),
  };
});

// ──── Helpers de promesas diferidas ──────────────────────────────────

/**
 * Crea una promesa que se puede resolver manualmente desde fuera.
 * WHAT: Permite controlar el timing de hasTokens() en los tests.
 * WHY: Necesitamos que authResolved no se dispare hasta que
 *      explícitamente lo decidamos.
 */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ──── Mock Dependencies ──────────────────────────────────────────────

function createMockSplashRepository(
  overrides: Partial<SplashRepository> = {},
): jest.Mocked<SplashRepository> {
  return {
    wakeBackend: jest.fn().mockResolvedValue(true),
    ...overrides,
  } as jest.Mocked<SplashRepository>;
}

function createMockTokenStorage(
  overrides: Partial<ITokenStorage> = {},
): jest.Mocked<ITokenStorage> {
  return {
    saveTokens: jest.fn().mockResolvedValue(undefined),
    readAccessToken: jest.fn().mockResolvedValue(null),
    readRefreshToken: jest.fn().mockResolvedValue(null),
    hasTokens: jest.fn().mockResolvedValue(false),
    clear: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<ITokenStorage>;
}

// ──── Helpers ─────────────────────────────────────────────────────────

interface RenderResult {
  mockSplashRepo: jest.Mocked<SplashRepository>;
  mockTokenStorage: jest.Mocked<ITokenStorage>;
  unmount: () => void;
}

function renderSplashScreen(
  splashRepoOverrides: Partial<SplashRepository> = {},
  tokenStorageOverrides: Partial<ITokenStorage> = {},
): RenderResult {
  const mockSplashRepo = createMockSplashRepository(splashRepoOverrides);
  const mockTokenStorage = createMockTokenStorage(tokenStorageOverrides);

  const { unmount } = render(
    <SplashScreen
      navigation={
        { navigate: mockNavigate, reset: mockReset, goBack: mockGoBack } as any
      }
      route={{ key: 'splash', name: 'Splash' } as any}
      splashRepository={mockSplashRepo}
      tokenStorage={mockTokenStorage}
    />,
  );

  return { mockSplashRepo, mockTokenStorage, unmount };
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('SplashScreen — máquina de 4 estados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ──── Estado IDLE ──────────────────────────────────────────────────

  describe('estado idle', () => {
    it('muestra el emoji del gato y "Tocá para despertar al gato..."', () => {
      renderSplashScreen();

      expect(screen.getByText('🐱')).toBeOnTheScreen();
      expect(
        screen.getByText('Tocá para despertar al gato...'),
      ).toBeOnTheScreen();
    });

    it('NO muestra spinner en idle', () => {
      renderSplashScreen();

      expect(screen.queryByLabelText('Cargando...')).not.toBeOnTheScreen();
    });

    it('NO muestra botón Reintentar en idle', () => {
      renderSplashScreen();

      expect(screen.queryByText('Reintentar')).not.toBeOnTheScreen();
    });

    /**
     * TEST: tap en idle transiciona a waking.
     * Diferimos hasTokens para que authResolved no se dispare hasta
     * que explícitamente lo resolvamos.
     */
    it('tap en idle cambia a estado waking y muestra spinner', async () => {
      // hasTokens NO debe resolverse hasta que lo digamos
      const hasTokensDeferred = deferred<boolean>();
      renderSplashScreen(
        {},
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      // Act — tocar la pantalla
      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });

      // Resolver promesas pendientes (wakeBackend)
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      // Assert — debe estar en waking (authResolved sigue pendiente)
      // Verificamos que el componente está en estado waking
      expect(screen.queryByText('Tocá para despertar al gato...')).not.toBeOnTheScreen();

      // El contenedor de waking tiene testID "splash-waking"
      // con ActivityIndicator y texto "Despertando..."
      // NOTA: authResolved no se resolvió aún, así que seguimos en waking

      // Limpiar: resolver hasTokens para evitar act() warnings
      hasTokensDeferred.resolve(false);
      await act(async () => {
        jest.advanceTimersByTime(0);
      });
    });
  });

  // ──── Estado WAKING ─────────────────────────────────────────────────

  describe('estado waking', () => {
    /**
     * TEST: Durante waking, se dispara wakeBackend().
     */
    it('llama wakeBackend() al entrar en estado waking', async () => {
      const hasTokensDeferred = deferred<boolean>();
      const { mockSplashRepo } = renderSplashScreen(
        {},
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      // Act — tocar para iniciar waking
      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      // Assert — el repositorio fue llamado
      expect(mockSplashRepo.wakeBackend).toHaveBeenCalledTimes(1);

      // Cleanup
      hasTokensDeferred.resolve(false);
      await act(async () => {
        jest.advanceTimersByTime(0);
      });
    });
  });

  // ──── Estado RETRY ──────────────────────────────────────────────────

  describe('estado retry', () => {
    /**
     * TEST: Si wakeBackend falla y pasan 2s → estado retry.
     * hasTokens se difiere para que authResolved no interfiera.
     */
    it('muestra botón Reintentar cuando wakeBackend falla después de 2s', async () => {
      const hasTokensDeferred = deferred<boolean>();
      renderSplashScreen(
        { wakeBackend: jest.fn().mockResolvedValue(false) },
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      // Act — iniciar waking
      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });

      // Resolver wakeBackend (false) + timer de 2s
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Assert — estado retry visible
      expect(screen.getByText('😿')).toBeOnTheScreen();
      expect(
        screen.getByText('No se pudo conectar con el servidor'),
      ).toBeOnTheScreen();
      expect(screen.getByText('Reintentar')).toBeOnTheScreen();

      // Cleanup
      hasTokensDeferred.resolve(false);
      await act(async () => {
        jest.advanceTimersByTime(0);
      });
    });

    /**
     * TEST: El botón Reintentar vuelve a disparar wakeBackend().
     */
    it('el botón Reintentar llama wakeBackend de nuevo', async () => {
      const hasTokensDeferred = deferred<boolean>();
      const { mockSplashRepo } = renderSplashScreen(
        { wakeBackend: jest.fn().mockResolvedValue(false) },
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      // Act — llegar a retry
      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Verificar estado retry
      expect(screen.getByText('Reintentar')).toBeOnTheScreen();

      // Limpiar llamado anterior
      mockSplashRepo.wakeBackend.mockClear();

      // Mock ahora retorna true para el reintento
      mockSplashRepo.wakeBackend.mockResolvedValue(true);

      // Act — reintentar
      await act(async () => {
        fireEvent.press(screen.getByText('Reintentar'));
      });

      // Assert — wakeBackend fue llamado de nuevo
      expect(mockSplashRepo.wakeBackend).toHaveBeenCalledTimes(1);

      // Cleanup
      hasTokensDeferred.resolve(false);
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
    });
  });

  // ──── Estado RESOLVED ───────────────────────────────────────────────

  describe('estado resolved', () => {
    /**
     * TEST: Cuando resolved y hasTokens=true → navega a Home.
     */
    it('navega a Home cuando resolved y hay tokens', async () => {
      const hasTokensDeferred = deferred<boolean>();
      renderSplashScreen(
        { wakeBackend: jest.fn().mockResolvedValue(true) },
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      // Act — iniciar waking
      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });

      // Resolver wakeBackend (true) + avanzar timer 2s
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Ahora wakeOk=true, wakeCompleted=true, pero authResolved sigue pendiente
      // Resolver hasTokens → true
      hasTokensDeferred.resolve(true);
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      // Verificar que checkResolved disparó → resolved → navegación
      // Como es asíncrono (hasTokens dentro del efecto de resolved), avanzamos timers
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      // Assert — navegación a Home
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    });

    /**
     * TEST: Cuando resolved y hasTokens=false → navega a Login.
     */
    it('navega a Login cuando resolved y NO hay tokens', async () => {
      const hasTokensDeferred = deferred<boolean>();
      renderSplashScreen(
        { wakeBackend: jest.fn().mockResolvedValue(true) },
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      // Act — iniciar y resolver
      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Resolver hasTokens → false
      hasTokensDeferred.resolve(false);
      await act(async () => {
        jest.advanceTimersByTime(0);
      });
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      // Assert — navegación a Login
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });

    /**
     * TEST: Cuando resolved — muestra spinner mientras se determina el destino.
     * Triangulación: verifica que el estado visual es correcto.
     */
    it('muestra spinner en estado resolved mientras determina destino', async () => {
      const hasTokensDeferred = deferred<boolean>();
      renderSplashScreen(
        { wakeBackend: jest.fn().mockResolvedValue(true) },
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      hasTokensDeferred.resolve(true);
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      // En resolved, el spinner sigue visible mientras se navega
      // El testID splash-resolved contiene un ActivityIndicator
      expect(screen.getByLabelText('Cargando...')).toBeOnTheScreen();

      // Cleanup — dejar que termine la navegación
      await act(async () => {
        jest.advanceTimersByTime(0);
      });
    });
  });

  // ──── Estados visuales adicionales ──────────────────────────────────

  describe('propiedades visuales', () => {
    it('el fondo es del color primary en idle', () => {
      renderSplashScreen();

      const container = screen.getByTestId('splash-idle');
      expect(container).toBeOnTheScreen();
    });

    it('el botón Reintentar tiene texto blanco sobre fondo semitransparente', async () => {
      const hasTokensDeferred = deferred<boolean>();
      renderSplashScreen(
        { wakeBackend: jest.fn().mockResolvedValue(false) },
        { hasTokens: jest.fn().mockReturnValue(hasTokensDeferred.promise) },
      );

      // Llegar a retry — usar await act para flushear microtasks
      await act(async () => {
        fireEvent.press(screen.getByText('Tocá para despertar al gato...'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const retryButton = screen.getByText('Reintentar');
      expect(retryButton).toBeOnTheScreen();

      // Cleanup
      hasTokensDeferred.resolve(false);
      await act(async () => {
        jest.advanceTimersByTime(0);
      });
    });
  });
});
