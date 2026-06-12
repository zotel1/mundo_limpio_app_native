/**
 * WHAT: Tests TDD para HomeScreen — pantalla principal post-login con ActionCards.
 * WHY: Validar que muestra ActionCards filtradas por rol, nombre de usuario,
 *      roles y botón de logout. Equivalente a home_screen.dart del Flutter.
 * BENEFITS: Cobertura de UX post-login para los 7 roles del sistema RBAC.
 *
 * TDD: GREEN — tests pasan con la implementación actual de HomeScreen.
 *
 * Estrategia: mockeamos solo useAuth y useAuthStore con spyOn para controlar
 * valores dinámicos por test. Los selectores (selectRoles, selectUsername) son
 * los reales del módulo para mantener coherencia.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useAuthModule from '@features/auth/presentation/hooks/useAuth';
import * as authStoreModule from '@features/auth/presentation/stores/authStore';

// ──── Mocks de React Navigation ──────────────────────────────────────

const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
      goBack: jest.fn(),
    }),
    useRoute: () => ({ name: 'Home', params: {} }),
  };
});

// ──── Wrapper ────────────────────────────────────────────────────────

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// ──── Import ─────────────────────────────────────────────────────────
import { HomeScreen } from '@features/auth/presentation/screens/HomeScreen';

// ──── Helpers ─────────────────────────────────────────────────────────

/** WHAT: Crea una sesión mock con los roles y username indicados. */
function mockAuthSession(roles: readonly string[], username: string) {
  return {
    userId: 1,
    username,
    email: 'test@mundolimpio.com',
    roles,
  };
}

/** WHAT: Configura useAuthStore para retornar los roles y username deseados. */
function setupAuthStore(roles: readonly string[], username: string) {
  const session = mockAuthSession(roles, username);
  const state = { status: 'authenticated' as const, session, error: null };

  jest.spyOn(authStoreModule, 'useAuthStore').mockImplementation((selector?: any) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

/** WHAT: Configura useAuth con el mock de logout. */
function setupUseAuth(logoutFn = jest.fn()) {
  jest.spyOn(useAuthModule, 'useAuth').mockReturnValue({
    login: jest.fn(),
    register: jest.fn(),
    logout: logoutFn,
    checkAuth: jest.fn() as any,
    clearError: jest.fn(),
    status: 'authenticated' as const,
    session: null,
    error: null,
    isLoading: false,
  });

  return logoutFn;
}

function renderHomeScreen() {
  return render(
    <HomeScreen
      navigation={{ navigate: mockNavigate, reset: mockReset } as any}
      route={{ key: 'home', name: 'Home' } as any}
    />,
    { wrapper: createWrapper() },
  );
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('HomeScreen — pantalla principal post-login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthStore(['ADMIN'], 'admin_user');
    setupUseAuth();
  });

  // ──── Renderizado ──────────────────────────────────────────────────

  it('renderiza nombre de usuario en el header', () => {
    setupAuthStore(['STOCK_OPERATOR'], 'operador_stock');

    renderHomeScreen();

    expect(screen.getByText(/operador_stock/)).toBeOnTheScreen();
  });

  it('renderiza roles del usuario', () => {
    setupAuthStore(['STOCK_OPERATOR', 'SALES_CLERK'], 'multi_role');

    renderHomeScreen();

    expect(screen.getByText('STOCK_OPERATOR · SALES_CLERK')).toBeOnTheScreen();
  });

  // ──── ActionCards por rol ──────────────────────────────────────────

  it('ADMIN ve todas las ActionCards (10)', () => {
    setupAuthStore(['ADMIN'], 'admin');

    renderHomeScreen();

    expect(screen.getByText('Ver Productos')).toBeOnTheScreen();
    expect(screen.getByText('Ver Inventario')).toBeOnTheScreen();
    expect(screen.getByText('Materias Primas')).toBeOnTheScreen();
    expect(screen.getByText('Producción')).toBeOnTheScreen();
    expect(screen.getByText('Nueva Venta')).toBeOnTheScreen();
    expect(screen.getByText('Historial Ventas')).toBeOnTheScreen();
    expect(screen.getByText('Usuarios')).toBeOnTheScreen();
    expect(screen.getByText('Nuevo Recibo')).toBeOnTheScreen();
    expect(screen.getByText('Historial Recibos')).toBeOnTheScreen();
    expect(screen.getByText('Backups')).toBeOnTheScreen();
  });

  it('CUSTOMER solo ve Ver Productos', () => {
    setupAuthStore(['CUSTOMER'], 'cliente');

    renderHomeScreen();

    expect(screen.getByText('Ver Productos')).toBeOnTheScreen();

    expect(screen.queryByText('Ver Inventario')).not.toBeOnTheScreen();
    expect(screen.queryByText('Usuarios')).not.toBeOnTheScreen();
    expect(screen.queryByText('Backups')).not.toBeOnTheScreen();
  });

  it('STOCK_OPERATOR ve productos e inventario', () => {
    setupAuthStore(['STOCK_OPERATOR'], 'stock_op');

    renderHomeScreen();

    expect(screen.getByText('Ver Productos')).toBeOnTheScreen();
    expect(screen.getByText('Ver Inventario')).toBeOnTheScreen();

    expect(screen.queryByText('Usuarios')).not.toBeOnTheScreen();
    expect(screen.queryByText('Backups')).not.toBeOnTheScreen();
  });

  it('SALES_CLERK ve ventas y productos', () => {
    setupAuthStore(['SALES_CLERK'], 'vendedor');

    renderHomeScreen();

    expect(screen.getByText('Ver Productos')).toBeOnTheScreen();
    expect(screen.getByText('Nueva Venta')).toBeOnTheScreen();
    expect(screen.getByText('Historial Ventas')).toBeOnTheScreen();

    expect(screen.queryByText('Ver Inventario')).not.toBeOnTheScreen();
    expect(screen.queryByText('Producción')).not.toBeOnTheScreen();
  });

  // ──── Navegación desde ActionCards ─────────────────────────────────

  it('navega a la ruta correcta al presionar una ActionCard', () => {
    setupAuthStore(['ADMIN'], 'admin');

    renderHomeScreen();

    fireEvent.press(screen.getByText('Ver Productos'));
    expect(mockNavigate).toHaveBeenCalledWith({ name: 'ProductsList' });
  });

  // ──── Logout ────────────────────────────────────────────────────────

  it('botón logout cierra sesión y redirige a Login', () => {
    const mockLogout = setupUseAuth();

    renderHomeScreen();

    fireEvent.press(screen.getByText('Salir'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  });

  // ──── Header ────────────────────────────────────────────────────────

  it('saluda al usuario con "¡Hola, <username>!"', () => {
    setupAuthStore(['ADMIN'], 'maria_stock');

    renderHomeScreen();

    expect(screen.getByText(/¡Hola, maria_stock!/)).toBeOnTheScreen();
  });

  it('cuando no hay username muestra "Usuario" por defecto', () => {
    setupAuthStore(['CUSTOMER'], '');

    renderHomeScreen();

    expect(screen.getByText(/¡Hola, Usuario!/)).toBeOnTheScreen();
  });
});
