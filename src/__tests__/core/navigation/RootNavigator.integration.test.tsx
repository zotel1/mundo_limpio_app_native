/**
 * WHAT: Tests de integración para RootNavigator con screens reales cableadas.
 * WHY: PR 3.0 — Reemplaza PlaceholderScreen en rutas auth + products por
 *      las pantallas reales (LoginScreen, RegisterScreen, HomeScreen,
 *      ProductsListScreen, ProductDetailScreen, ProductFormScreen).
 *      Inventory/Sales/etc. deben seguir usando PlaceholderScreen.
 * BENEFITS: Verifica que el navigator registra la screen correcta para
 *           cada ruta. Sin depender de las implementaciones reales de
 *           cada pantalla (deps pesadas como MMKV, API calls, etc.).
 *
 * TDD: RED → estos tests fallan hasta que RootNavigator importe y use
 *      las screens reales en lugar de PlaceholderScreen.
 *
 * Estrategia:
 * - Mockeamos cada screen real con un componente de test identificable
 *   (accessibilityLabel distinto para cada una).
 * - Mockeamos @react-navigation/native-stack con un Navigator que captura
 *   las screens registradas y permite override de initialRouteName para
 *   poder testear cualquier ruta, no solo Login/Home.
 * - Mockeamos @react-navigation/native (mismo patrón que test existente).
 * - Aserciones: verificamos que la screen activa renderiza el mock
 *   esperado, y que rutas no cableadas aún usan PlaceholderScreen.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { ITokenStorage } from '@core/storage/tokenStorage';

// ──── Mocks de Screens Reales ─────────────────────────────────────────
// WHAT: Cada screen se mockea con un componente mínimo que expone un
//       accessibilityLabel único, permitiendo identificar qué screen
//       se renderizó sin instanciar sus dependencias reales.
// WHY: Las screens reales importan MMKV, Axios, TanStack Query, etc.
//      Mockearlas nos permite testear el NAVIGATOR sin esas dependencias.

jest.mock('@features/auth/presentation/screens/LoginScreen', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    LoginScreen: () =>
      React.createElement(
        View,
        { accessibilityLabel: 'LoginScreen-real' },
        React.createElement(Text, null, 'LoginScreen'),
      ),
  };
});

jest.mock('@features/auth/presentation/screens/RegisterScreen', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    RegisterScreen: () =>
      React.createElement(
        View,
        { accessibilityLabel: 'RegisterScreen-real' },
        React.createElement(Text, null, 'RegisterScreen'),
      ),
  };
});

jest.mock('@features/auth/presentation/screens/HomeScreen', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    HomeScreen: () =>
      React.createElement(
        View,
        { accessibilityLabel: 'HomeScreen-real' },
        React.createElement(Text, null, 'HomeScreen'),
      ),
  };
});

jest.mock('@features/products/presentation/screens/ProductsListScreen', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    ProductsListScreen: () =>
      React.createElement(
        View,
        { accessibilityLabel: 'ProductsListScreen-real' },
        React.createElement(Text, null, 'ProductsListScreen'),
      ),
  };
});

jest.mock('@features/products/presentation/screens/ProductDetailScreen', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    ProductDetailScreen: () =>
      React.createElement(
        View,
        { accessibilityLabel: 'ProductDetailScreen-real' },
        React.createElement(Text, null, 'ProductDetailScreen'),
      ),
  };
});

jest.mock('@features/products/presentation/screens/ProductFormScreen', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    ProductFormScreen: () =>
      React.createElement(
        View,
        { accessibilityLabel: 'ProductFormScreen-real' },
        React.createElement(Text, null, 'ProductFormScreen'),
      ),
  };
});

// ──── Mock: @react-navigation/native ──────────────────────────────────
// WHAT: Mismo mock que el test existente de RootNavigator.
// WHY: NavigationContainer arrastra dependencias nativas innecesarias
//      para tests unitarios.

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

// ──── Mock: @react-navigation/native-stack ────────────────────────────
// WHAT: Navigator que captura todas las screens registradas y permite
//       override de initialRouteName para testear cualquier ruta.
// WHY: El RootNavigator real solo permite acceder a Login o Home vía
//      estado de autenticación. Con el override podemos verificar que
//      ProductsList, ProductDetail, InventoryList, etc. están
//      correctamente mapeadas a sus screens.

let mockCapturedScreens: Array<{
  name: string;
  component: React.ComponentType<any>;
  componentName: string;
}> = [];

let mockOverrideInitialRouteName: string | null = null;

export function __setOverrideRoute(name: string | null) {
  mockOverrideInitialRouteName = name;
}

export function __getCapturedScreens() {
  return mockCapturedScreens;
}

jest.mock('@react-navigation/native-stack', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    createNativeStackNavigator: () => {
      function MockNavigator({
        children,
        initialRouteName,
        screenOptions: _screenOptions,
      }: {
        children: React.ReactNode;
        initialRouteName?: string;
        screenOptions?: Record<string, unknown>;
      }) {
        // WHAT: Capturar todas las screens registradas como children
        // WHY: Permite verificar la estructura completa del navigator
        //      desde los tests: screen count, componente por ruta.
        const childrenArray = React.Children.toArray(
          children,
        ) as React.ReactElement[];
        mockCapturedScreens = childrenArray.map(child => ({
          name: child.props.name as string,
          component: child.props.component as React.ComponentType<any>,
          componentName:
            (child.props.component as { name?: string })?.name ||
            'anonymous',
        }));

        // WHAT: Permitir override de initialRouteName para testear
        //       cualquier ruta, no solo Login/Home.
        const effectiveRoute =
          mockOverrideInitialRouteName || initialRouteName || 'Login';

        const activeScreen = childrenArray.find(
          child => child.props.name === effectiveRoute,
        );

        if (!activeScreen) {
          return React.createElement(View, { testID: 'empty-navigator' });
        }

        const ScreenComponent = activeScreen.props.component;
        return React.createElement(ScreenComponent, {
          route: {
            name: activeScreen.props.name,
            params: effectiveRoute === 'ProductDetail'
              ? { productId: 42 }
              : effectiveRoute === 'ProductForm'
                ? { productId: undefined }
                : undefined,
          },
          navigation: { navigate: jest.fn(), goBack: jest.fn() },
        });
      }

      function MockScreen(_props: {
        name: string;
        component: React.ComponentType<any>;
        options?: Record<string, unknown>;
      }) {
        return null;
      }

      return {
        Navigator: MockNavigator,
        Screen: MockScreen,
      };
    },
  };
});

// ──── Import del componente bajo test ────────────────────────────────
// WHAT: Importamos DESPUÉS de todos los mocks para que Jest los aplique.
import { RootNavigator } from '@core/navigation/RootNavigator';

// ──── Helpers ────────────────────────────────────────────────────────

function createMockStorage(
  overrides: Partial<ITokenStorage> = {},
): ITokenStorage {
  return {
    saveTokens: jest.fn<Promise<void>, [string, string]>(),
    readAccessToken: jest
      .fn<Promise<string | null>, []>()
      .mockResolvedValue(null),
    readRefreshToken: jest
      .fn<Promise<string | null>, []>()
      .mockResolvedValue(null),
    hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(false),
    clear: jest.fn<Promise<void>, []>(),
    ...overrides,
  };
}

// ──── Suite: PR 3.0 — Screens Reales Cableadas ───────────────────────

describe('RootNavigator — PR 3.0: screens reales vs PlaceholderScreen', () => {
  beforeEach(() => {
    mockOverrideInitialRouteName = null;
    mockCapturedScreens = [];
  });

  // ──── Auth Routes ────────────────────────────────────────────────

  it('Login route renderiza LoginScreen (no PlaceholderScreen)', async () => {
    mockOverrideInitialRouteName = 'Login';
    const mockStorage = createMockStorage({
      hasTokens: jest.fn<Promise<boolean>, []>().mockResolvedValue(false),
    });

    render(<RootNavigator tokenStorage={mockStorage} />);

    // Esperar a que checkAuth termine y el navigator se renderice
    await waitFor(() => {
      expect(screen.getByLabelText('LoginScreen-real')).toBeOnTheScreen();
    });

    // PlaceholderScreen no debe estar renderizado
    expect(
      screen.queryByLabelText('Pantalla: Login'),
    ).not.toBeOnTheScreen();
  });

  it('Register route renderiza RegisterScreen (no PlaceholderScreen)', async () => {
    mockOverrideInitialRouteName = 'Register';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(screen.getByLabelText('RegisterScreen-real')).toBeOnTheScreen();
    });
    expect(
      screen.queryByLabelText('Pantalla: Register'),
    ).not.toBeOnTheScreen();
  });

  it('Home route renderiza HomeScreen (no PlaceholderScreen)', async () => {
    mockOverrideInitialRouteName = 'Home';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(screen.getByLabelText('HomeScreen-real')).toBeOnTheScreen();
    });
    expect(
      screen.queryByLabelText('Pantalla: Home'),
    ).not.toBeOnTheScreen();
  });

  // ──── Products Routes ────────────────────────────────────────────

  it('ProductsList route renderiza ProductsListScreen', async () => {
    mockOverrideInitialRouteName = 'ProductsList';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('ProductsListScreen-real'),
      ).toBeOnTheScreen();
    });
    expect(
      screen.queryByLabelText('Pantalla: ProductsList'),
    ).not.toBeOnTheScreen();
  });

  it('ProductDetail route renderiza ProductDetailScreen', async () => {
    mockOverrideInitialRouteName = 'ProductDetail';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('ProductDetailScreen-real'),
      ).toBeOnTheScreen();
    });
    expect(
      screen.queryByLabelText('Pantalla: ProductDetail'),
    ).not.toBeOnTheScreen();
  });

  it('ProductForm route renderiza ProductFormScreen', async () => {
    mockOverrideInitialRouteName = 'ProductForm';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('ProductFormScreen-real'),
      ).toBeOnTheScreen();
    });
    expect(
      screen.queryByLabelText('Pantalla: ProductForm'),
    ).not.toBeOnTheScreen();
  });

  // ──── Inventory Route — aún PlaceholderScreen ─────────────────────

  it('InventoryList route aún renderiza PlaceholderScreen (no implementado)', async () => {
    mockOverrideInitialRouteName = 'InventoryList';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    // PlaceholderScreen renderiza un ActivityIndicator con
    // accessibilityLabel="Pantalla: {routeName}"
    await waitFor(() => {
      expect(
        screen.getByLabelText('Pantalla: InventoryList'),
      ).toBeOnTheScreen();
    });
  });

  // ──── Screen Count ───────────────────────────────────────────────

  it('el navigator registra 26 screens (Splash + 25 rutas del RootStackParamList)', async () => {
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    // Esperar a que el navigator se renderice (screen capturadas)
    await waitFor(() => {
      // Una vez renderizado, las screens capturadas deben ser > 0
      expect(mockCapturedScreens.length).toBeGreaterThan(0);
    });

    // 27 = 1 Splash + 26 rutas definidas en RootStackParamList
    expect(mockCapturedScreens.length).toBe(27);
  });

  // ──── PlaceholderScreen para rutas no implementadas ───────────────

  it('SalesCreate route aún usa PlaceholderScreen (Fase 4 no implementada)', async () => {
    mockOverrideInitialRouteName = 'SalesCreate';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Pantalla: SalesCreate'),
      ).toBeOnTheScreen();
    });
  });

  it('Notifications route aún usa PlaceholderScreen (Fase 7 no implementada)', async () => {
    mockOverrideInitialRouteName = 'Notifications';
    const mockStorage = createMockStorage();

    render(<RootNavigator tokenStorage={mockStorage} />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Pantalla: Notifications'),
      ).toBeOnTheScreen();
    });
  });
});
