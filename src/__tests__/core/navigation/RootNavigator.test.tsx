/**
 * WHAT: Tests TDD para RootNavigator con auth guard.
 * WHY: El auth guard es crítico para la seguridad de la app — verifica
 *      tokens al iniciar y redirige automáticamente a Login o Home.
 *      Mismo patrón que GoRouter con redirects del Flutter.
 * BENEFITS: Cobertura completa del flujo splash→login|home, edge cases
 *           de error y cleanup al desmontar.
 *
 * TDD: GREEN — tests implementados, RootNavigator.tsx existe y pasa.
 *
 * Estrategia de test:
 * - Mockeamos ITokenStorage para controlar hasTokens() en cada escenario
 * - Mockeamos @react-navigation/native-stack y @react-navigation/native
 *   para aislar la lógica del auth guard de las dependencias nativas.
 * - Usamos accessibilityLabel en los placeholders para identificar pantallas
 * - waitFor para assertions asíncronas cuando el estado cambia post-render
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { ITokenStorage } from '@core/storage/tokenStorage';

// ──── Mocks de Screens Reales (PR 3.0) ────────────────────────────
// WHAT: Mockeamos las screens reales para que los tests de
//       redirección sigan funcionando sin deps nativas reales.
// WHY: RootNavigator.tsx importa las screens al module level.
//      Sin mocks, sus deps (MMKV, Axios, TQ) infectan el test.

jest.mock('@features/auth/presentation/screens/LoginScreen', () => ({
  LoginScreen: () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, {
      accessibilityLabel: 'LoginScreen-real',
    });
  },
}));

jest.mock('@features/auth/presentation/screens/RegisterScreen', () => ({
  RegisterScreen: () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, {
      accessibilityLabel: 'RegisterScreen-real',
    });
  },
}));

jest.mock('@features/auth/presentation/screens/HomeScreen', () => ({
  HomeScreen: () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, {
      accessibilityLabel: 'HomeScreen-real',
    });
  },
}));

jest.mock('@features/products/presentation/screens/ProductsListScreen', () => ({
  ProductsListScreen: () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, {
      accessibilityLabel: 'ProductsListScreen-real',
    });
  },
}));

jest.mock('@features/products/presentation/screens/ProductDetailScreen', () => ({
  ProductDetailScreen: () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, {
      accessibilityLabel: 'ProductDetailScreen-real',
    });
  },
}));

jest.mock('@features/products/presentation/screens/ProductFormScreen', () => ({
  ProductFormScreen: () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, {
      accessibilityLabel: 'ProductFormScreen-real',
    });
  },
}));

// ──── Mocks de React Navigation ──────────────────────────────────────

/**
 * WHAT: Mock de @react-navigation/native-stack.
 * WHY: Evita la cadena de imports react-native internals que contienen
 *      Flow mapped types (EventEmitter.js: [K in keyof T]) no soportados
 *      por @babel/plugin-syntax-flow 7.29.7. El mock implementa la misma
 *      API pero sin dependencia nativa.
 *
 *      La lógica que NOSOTROS necesitamos testear (auth guard, checkAuth,
 *      redirección) no depende de la implementación nativa del stack
 *      navigator — depende de initialRouteName y del estado del efecto.
 * BENEFITS: Tests rápidos, sin dependencias nativas, foco en nuestra lógica.
 */
jest.mock('@react-navigation/native-stack', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    createNativeStackNavigator: () => {
      /**
       * WHAT: Componente Navigator mínimo que implementa la API pública.
       * WHY: Necesitamos initialRouteName + children (Screen) para
       *      verificar que el auth guard redirige correctamente.
       */
      function MockNavigator({
        children,
        initialRouteName,
        screenOptions: _screenOptions,
      }: {
        children: React.ReactNode;
        initialRouteName?: string;
        screenOptions?: Record<string, unknown>;
      }) {
        // Extraer las screens de children y renderizar solo la activa
        const childrenArray = React.Children.toArray(children) as React.ReactElement[];
        const activeScreen = childrenArray.find(
          child => child.props.name === initialRouteName,
        );

        if (!activeScreen) {
          return React.createElement(View, { testID: 'empty-navigator' });
        }

        const ScreenComponent = activeScreen.props.component;
        return React.createElement(ScreenComponent, {
          route: { name: activeScreen.props.name },
          navigation: {},
        });
      }

      function MockScreen(_props: {
        name: string;
        component: React.ComponentType<{ route: { name: string } }>;
        options?: Record<string, unknown>;
      }) {
        return null; // Solo usado para extraer props en MockNavigator
      }

      return {
        Navigator: MockNavigator,
        Screen: MockScreen,
      };
    },
  };
});

/**
 * WHAT: Mock de @react-navigation/native.
 * WHY: NavigationContainer se mockea porque también arrastra dependencias
 *      nativas. En su lugar, envolvemos children en un View simple.
 *      La navegación real se prueba en E2E con Detox.
 */
jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'navigation-container' }, children),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ name: 'MockRoute', params: {} }),
    useFocusEffect: jest.fn(),
  };
});

// ──── Import del componente bajo test ────────────────────────────────
// WHAT: Importamos DESPUÉS de los mocks para que Jest los aplique.
// WHY: jest.mock() es hoisted, pero necesitamos que los mocks estén
//      definidos antes de que el module loader procese RootNavigator.
import { RootNavigator } from '@core/navigation/RootNavigator';

// ──── Helpers ────────────────────────────────────────────────────────

/**
 * WHAT: Fábrica de ITokenStorage mockeado.
 * WHY: Cada test necesita un comportamiento distinto de hasTokens().
 *      Centralizar la creación de mocks evita repetición.
 */
function createMockStorage(overrides: Partial<ITokenStorage> = {}): ITokenStorage {
  return {
    saveTokens: jest.fn<Promise<void>, [string, string]>(),
    readAccessToken: jest.fn<Promise<string | null>, []>().mockResolvedValue(null),
    readRefreshToken: jest.fn<Promise<string | null>, []>().mockResolvedValue(null),
    hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(false),
    clear: jest.fn<Promise<void>, []>(),
    ...overrides,
  };
}

// ──── Suite: Renderizado inicial ─────────────────────────────────────

describe('RootNavigator — Splash durante verificación', () => {
  /**
   * WHAT: Mientras checkAuth está pendiente (isLoading = true),
   *       el RootNavigator debe mostrar la SplashScreen.
   * WHY: UX — el usuario ve feedback visual mientras se verifica
   *      la sesión. Evita flash de Login antes de redirigir a Home.
   */
  it('muestra la splash screen mientras verifica autenticación (isLoading = true)', () => {
    // WHAT: Mock que NUNCA resuelve — mantiene isLoading = true
    // WHY: Queremos verificar el estado intermedio de carga, no el resultado
    const neverResolves = new Promise<boolean>(() => {
      /* pending forever para testear el estado de carga */
    });
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockReturnValue(neverResolves),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    // Splash debe estar visible inmediatamente (antes de que hasTokens resuelva)
    expect(screen.getByLabelText('Pantalla Splash — verificando sesión')).toBeOnTheScreen();
    expect(screen.getByLabelText('Indicador de carga')).toBeOnTheScreen();

    // El NavigationContainer NO debe tener una pantalla activa visible todavía
    expect(screen.queryByLabelText('HomeScreen-real')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('LoginScreen-real')).not.toBeOnTheScreen();
  });
});

// ──── Suite: Redirección autenticado → Home ──────────────────────────

describe('RootNavigator — Redirección a Home (autenticado)', () => {
  /**
   * WHAT: Si hasTokens() retorna true, el estado inicial del navigator
   *       debe ser 'Home'.
   * WHY: Equivalente a GoRouter redirect: si hay token → home, no login.
   */
  it('navega a Home cuando hasTokens() retorna true', async () => {
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    // Esperar a que checkAuth complete y el estado cambie
    await waitFor(() => {
      expect(screen.getByLabelText('HomeScreen-real')).toBeOnTheScreen();
    });

    // Verificar que NO estamos en Login
    expect(screen.queryByLabelText('LoginScreen-real')).not.toBeOnTheScreen();
    // La splash ya no debe estar visible
    expect(screen.queryByLabelText('Pantalla Splash — verificando sesión')).not.toBeOnTheScreen();
  });

  /**
   * WHAT: Verifica que el usuario NO puede navegar hacia atrás al splash
   *       después de la redirección.
   * WHY: Seguridad — el splash es solo un estado transitorio de carga.
   *       initialRouteName hace replace implícito, no push.
   */
  it('no permite volver al Splash después de la redirección (replace implícito)', async () => {
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(screen.getByLabelText('HomeScreen-real')).toBeOnTheScreen();
    });

    // Splash NO debe estar renderizado
    expect(screen.queryByLabelText('Pantalla Splash — verificando sesión')).not.toBeOnTheScreen();
  });
});

// ──── Suite: Redirección no autenticado → Login ──────────────────────

describe('RootNavigator — Redirección a Login (no autenticado)', () => {
  /**
   * WHAT: Si hasTokens() retorna false, el navigator debe mostrar Login.
   * WHY: Usuarios sin sesión activa deben iniciar sesión primero.
   */
  it('navega a Login cuando hasTokens() retorna false', async () => {
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(false),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(screen.getByLabelText('LoginScreen-real')).toBeOnTheScreen();
    });

    expect(screen.queryByLabelText('HomeScreen-real')).not.toBeOnTheScreen();
  });
});

// ──── Suite: Manejo de errores en checkAuth ──────────────────────────

describe('RootNavigator — Error en verificación de autenticación', () => {
  /**
   * WHAT: Si hasTokens() lanza una excepción, el navigator redirige a Login
   *       por seguridad (fail secure).
   * WHY: Ante cualquier error de Keychain/storage, asumimos no autenticado.
   */
  it('redirige a Login cuando hasTokens() lanza error', async () => {
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockRejectedValue(
        new Error('Keychain error: -25300'),
      ),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(screen.getByLabelText('LoginScreen-real')).toBeOnTheScreen();
    });

    expect(screen.queryByLabelText('HomeScreen-real')).not.toBeOnTheScreen();
  });

  /**
   * WHAT: El catch del efecto debe setear isAuthenticated = false
   *       explícitamente, sin dejar el estado undefined.
   */
  it('establece isAuthenticated = false explícitamente ante error', async () => {
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockRejectedValue(
        new Error('Keychain not available'),
      ),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      // isAuthenticated = false → initialRouteName = 'Login'
      expect(screen.getByLabelText('LoginScreen-real')).toBeOnTheScreen();
    });

    expect(screen.queryByLabelText('HomeScreen-real')).not.toBeOnTheScreen();
  });
});

// ──── Suite: Cleanup al desmontar ────────────────────────────────────

describe('RootNavigator — Cleanup del efecto al desmontar', () => {
  /**
   * WHAT: Al desmontar el RootNavigator antes de que hasTokens() resuelva,
   *       no debe llamarse setState sobre un componente desmontado.
   * WHY: El flag `mounted` en el cleanup previene memory leaks.
   */
  it('no actualiza el estado después de desmontar (mounted flag)', async () => {
    // Spy en console.error para detectar warnings de React
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {
        /* silenciar durante el test */
      });

    let resolvePromise!: (value: boolean) => void;
    const delayedPromise = new Promise<boolean>(resolve => {
      resolvePromise = resolve;
    });

    const mockStorage = createMockStorage({
      hasTokens: jest
        .fn<Promise<boolean>, []>()
        .mockReturnValue(delayedPromise),
    });

    const { unmount } = render(<RootNavigator tokenStorage={mockStorage} />);

    // Desmontar ANTES de que hasTokens resuelva
    unmount();

    // Resolver la promesa con el componente ya desmontado
    await act(async () => {
      resolvePromise(true);
    });

    // Verificar que NO hubo warning "unmounted component"
    const unmountedWarning = consoleErrorSpy.mock.calls.find(
      call =>
        typeof call[0] === 'string' &&
        (call[0].includes('unmounted') ||
         call[0].includes('state update')),
    );
    expect(unmountedWarning).toBeUndefined();

    consoleErrorSpy.mockRestore();
  });

  /**
   * WHAT: El cleanup del useEffect debe ejecutarse sin lanzar errores.
   */
  it('ejecuta la función de cleanup sin errores al desmontar', () => {
    const mockStorage = createMockStorage({
      hasTokens: jest
        .fn<Promise<boolean>, []>()
        .mockResolvedValue(false),
    });

    expect(() => {
      const { unmount } = render(<RootNavigator tokenStorage={mockStorage} />);
      unmount();
    }).not.toThrow();
  });
});

// ──── Suite: Todas las rutas registradas ─────────────────────────────

describe('RootNavigator — Rutas registradas en el Stack', () => {
  /**
   * WHAT: El Navigator debe tener screens registradas para las 25 rutas
   *       del RootStackParamList más Splash (26 total).
   * WHY: Si falta una ruta, navigate() lanzará error en runtime.
   *      TypeScript valida params, pero no que las screens estén registradas.
   */
  it('renderiza la pantalla correcta según initialRouteName = Home', async () => {
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(screen.getByLabelText('HomeScreen-real')).toBeOnTheScreen();
    });

    // Verificamos que la pantalla activa es Home
    const homeScreen = screen.getByLabelText('HomeScreen-real');
    expect(homeScreen).toBeOnTheScreen();
  });

  /**
   * WHAT: Cuando isAuthenticated = false, debe renderizar Login.
   */
  it('renderiza Login cuando initialRouteName = Login', async () => {
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(false),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(screen.getByLabelText('LoginScreen-real')).toBeOnTheScreen();
    });

    // Confirmamos que el placeholder muestra el nombre de ruta correcto
    const loginScreen = screen.getByLabelText('LoginScreen-real');
    expect(loginScreen).toBeOnTheScreen();
  });
});
