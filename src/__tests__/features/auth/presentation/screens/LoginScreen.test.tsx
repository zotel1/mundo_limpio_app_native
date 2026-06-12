/**
 * WHAT: Tests TDD para LoginScreen — formulario de inicio de sesión.
 * WHY: Validar email + password, estados visuales (loading, error, redirección)
 *      y navegación a Register. Equivalente a login_screen.dart del Flutter.
 * BENEFITS: Cobertura completa de UX — loading spinner, error banner, validation.
 *
 * TDD: RED → estos tests fallan hasta implementar LoginScreen.
 *
 * Estrategia de test:
 * - Mockeamos useAuth para controlar isLoading, error, status en cada escenario.
 * - Mockeamos @react-navigation/native para testear navegación.
 * - Usamos fireEvent para simular interacciones del usuario.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    useRoute: () => ({ name: 'Login', params: {} }),
  };
});

// ──── Mock de useAuth ────────────────────────────────────────────────

const mockLogin = jest.fn();
const mockClearError = jest.fn();

const createMockUseAuth = (overrides: Record<string, unknown> = {}) => ({
  login: mockLogin,
  register: jest.fn(),
  logout: jest.fn(),
  checkAuth: jest.fn(),
  clearError: mockClearError,
  status: 'unauthenticated',
  session: null,
  error: null,
  isLoading: false,
  ...overrides,
});

let mockUseAuthValue = createMockUseAuth();

jest.mock('@features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => mockUseAuthValue,
}));

jest.mock('@react-navigation/native-stack', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, null, children),
      Screen: ({ children }: { children?: React.ReactNode; name: string }) =>
        React.createElement(View, null, children),
    }),
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

import { LoginScreen } from '@features/auth/presentation/screens/LoginScreen';

// ──── Helpers ─────────────────────────────────────────────────────────

function renderLoginScreen() {
  return render(
    <LoginScreen
      navigation={{ navigate: mockNavigate, reset: mockReset } as any}
      route={{ key: 'login', name: 'Login' } as any}
    />,
    { wrapper: createWrapper() },
  );
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('LoginScreen — formulario de inicio de sesión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthValue = createMockUseAuth();
  });

  // ──── Renderizado ──────────────────────────────────────────────────

  it('renderiza campos email y password', () => {
    renderLoginScreen();

    expect(screen.getByPlaceholderText('usuario@email.com')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Tu contraseña')).toBeOnTheScreen();
    expect(screen.getByText('Iniciar Sesión')).toBeOnTheScreen();
  });

  it('renderiza el título MundoLimpio y subtítulo', () => {
    renderLoginScreen();

    expect(screen.getByText('MundoLimpio')).toBeOnTheScreen();
    expect(screen.getByText('Iniciá sesión para continuar')).toBeOnTheScreen();
  });

  // ──── Validación ───────────────────────────────────────────────────

  it('muestra error si email vacío al submit', async () => {
    renderLoginScreen();

    fireEvent.press(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(screen.getByText('El email es requerido')).toBeOnTheScreen();
    });
  });

  it('muestra error si email inválido', async () => {
    renderLoginScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'no-es-email',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(screen.getByText('Ingresá un email válido')).toBeOnTheScreen();
    });
  });

  it('muestra error si password vacío al submit', async () => {
    renderLoginScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'test@test.com',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(screen.getByText('La contraseña es requerida')).toBeOnTheScreen();
    });
  });

  // ──── Estados visuales ─────────────────────────────────────────────

  it('botón muestra spinner durante loading', () => {
    mockUseAuthValue = createMockUseAuth({ isLoading: true });

    renderLoginScreen();

    expect(screen.getByLabelText('Cargando...')).toBeOnTheScreen();
    expect(screen.queryByText('Iniciar Sesión')).not.toBeOnTheScreen();
  });

  it('error banner se muestra cuando hay error', () => {
    mockUseAuthValue = createMockUseAuth({
      error: 'Credenciales inválidas',
      status: 'unauthenticated',
    });

    renderLoginScreen();

    expect(screen.getByText('Credenciales inválidas')).toBeOnTheScreen();
  });

  it('error banner tiene botón para cerrar', () => {
    mockUseAuthValue = createMockUseAuth({
      error: 'Error de red',
      status: 'unauthenticated',
    });

    renderLoginScreen();

    // El botón de cerrar (✕) debe ser clickeable
    expect(screen.getByText('✕')).toBeOnTheScreen();
  });

  // ──── Submit ───────────────────────────────────────────────────────

  it('llama login() con email y password al submit válido', async () => {
    renderLoginScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'admin@mundolimpio.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Tu contraseña'),
      'Admin123',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@mundolimpio.com',
        password: 'Admin123',
      });
    });
  });

  it('limpia el error antes de hacer login', async () => {
    mockUseAuthValue = createMockUseAuth({
      error: 'Error anterior',
      status: 'unauthenticated',
    });

    renderLoginScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'admin@mundolimpio.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Tu contraseña'),
      'Admin123',
    );
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // ──── Navegación ───────────────────────────────────────────────────

  it('link "Registrate" navega a Register', () => {
    renderLoginScreen();

    fireEvent.press(screen.getByText('¿No tenés cuenta? Registrate'));

    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('redirige al Home cuando el status es authenticated', () => {
    mockUseAuthValue = createMockUseAuth({
      status: 'authenticated',
      session: {
        userId: 1,
        username: 'admin',
        email: 'admin@test.com',
        roles: ['ADMIN'],
      },
    });

    renderLoginScreen();

    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });

  // ──── Estados del formulario ───────────────────────────────────────

  it('inputs están deshabilitados durante loading', () => {
    mockUseAuthValue = createMockUseAuth({ isLoading: true });

    renderLoginScreen();

    const emailInput = screen.getByPlaceholderText('usuario@email.com');
    const passwordInput = screen.getByPlaceholderText('Tu contraseña');

    expect(emailInput.props.editable).toBe(false);
    expect(passwordInput.props.editable).toBe(false);
  });

  it('link de registro está deshabilitado durante loading', () => {
    mockUseAuthValue = createMockUseAuth({ isLoading: true });

    renderLoginScreen();

    const link = screen.getByText('¿No tenés cuenta? Registrate');
    fireEvent.press(link);

    // No debe navegar porque está disabled
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
