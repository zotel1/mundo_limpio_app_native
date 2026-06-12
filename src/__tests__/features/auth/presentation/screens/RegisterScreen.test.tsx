/**
 * WHAT: Tests TDD para RegisterScreen — formulario de registro.
 * WHY: Validar email + password (fortaleza) + confirmPassword.
 *      Equivalente a register_screen.dart del Flutter.
 * BENEFITS: Cobertura de validación client-side, éxito con mensaje verde,
 *           redirección al login después del registro exitoso.
 *
 * TDD: RED → estos tests fallan hasta implementar RegisterScreen.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ──── Mocks de React Navigation ──────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: jest.fn(),
    }),
    useRoute: () => ({ name: 'Register', params: {} }),
  };
});

// ──── Mock de useAuth ────────────────────────────────────────────────

const mockRegister = jest.fn();
const mockClearError = jest.fn();

const createMockUseAuth = (overrides: Record<string, unknown> = {}) => ({
  login: jest.fn(),
  register: mockRegister,
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

import { RegisterScreen } from '@features/auth/presentation/screens/RegisterScreen';

// ──── Helpers ─────────────────────────────────────────────────────────

function renderRegisterScreen() {
  return render(
    <RegisterScreen
      navigation={{ navigate: mockNavigate, goBack: mockGoBack } as any}
      route={{ key: 'register', name: 'Register' } as any}
    />,
    { wrapper: createWrapper() },
  );
}

// ──── Suite ───────────────────────────────────────────────────────────

describe('RegisterScreen — formulario de registro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthValue = createMockUseAuth();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ──── Renderizado ──────────────────────────────────────────────────

  it('renderiza campos email, password y confirmPassword', () => {
    renderRegisterScreen();

    expect(screen.getByPlaceholderText('usuario@email.com')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Al menos 6 caracteres')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Repetí tu contraseña')).toBeOnTheScreen();
    expect(screen.getByText('Crear Cuenta')).toBeOnTheScreen();
  });

  it('renderiza el título y subtítulo', () => {
    renderRegisterScreen();

    expect(screen.getByText('Registro')).toBeOnTheScreen();
    expect(screen.getByText('Creá tu cuenta en MundoLimpio')).toBeOnTheScreen();
  });

  // ──── Validación: password demasiado corto ──────────────────────────

  it('muestra error si password < 6 caracteres', async () => {
    renderRegisterScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'test@test.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Al menos 6 caracteres'),
      'Ab1',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Repetí tu contraseña'),
      'Ab1',
    );
    fireEvent.press(screen.getByText('Crear Cuenta'));

    await waitFor(() => {
      expect(screen.getByText('Mínimo 6 caracteres')).toBeOnTheScreen();
    });
  });

  // ──── Validación: falta mayúscula ──────────────────────────────────

  it('muestra error si password no tiene mayúscula', async () => {
    renderRegisterScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'test@test.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Al menos 6 caracteres'),
      'abcdef1',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Repetí tu contraseña'),
      'abcdef1',
    );
    fireEvent.press(screen.getByText('Crear Cuenta'));

    await waitFor(() => {
      expect(
        screen.getByText('Debe contener al menos una mayúscula'),
      ).toBeOnTheScreen();
    });
  });

  // ──── Validación: falta número ─────────────────────────────────────

  it('muestra error si password no tiene número', async () => {
    renderRegisterScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'test@test.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Al menos 6 caracteres'),
      'Abcdefg',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Repetí tu contraseña'),
      'Abcdefg',
    );
    fireEvent.press(screen.getByText('Crear Cuenta'));

    await waitFor(() => {
      expect(
        screen.getByText('Debe contener al menos un número'),
      ).toBeOnTheScreen();
    });
  });

  // ──── Validación: contraseñas no coinciden ─────────────────────────

  it('muestra error si passwords no coinciden', async () => {
    renderRegisterScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'test@test.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Al menos 6 caracteres'),
      'Secure1',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Repetí tu contraseña'),
      'Secure2',
    );
    fireEvent.press(screen.getByText('Crear Cuenta'));

    await waitFor(() => {
      expect(
        screen.getByText('Las contraseñas no coinciden'),
      ).toBeOnTheScreen();
    });
  });

  // ──── Validación: email vacío ──────────────────────────────────────

  it('muestra error si email vacío', async () => {
    renderRegisterScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('Al menos 6 caracteres'),
      'Secure1',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Repetí tu contraseña'),
      'Secure1',
    );
    fireEvent.press(screen.getByText('Crear Cuenta'));

    await waitFor(() => {
      expect(screen.getByText('El email es requerido')).toBeOnTheScreen();
    });
  });

  // ──── Éxito ─────────────────────────────────────────────────────────

  it('éxito: register() llama al hook con los datos correctos', async () => {
    renderRegisterScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('usuario@email.com'),
      'nuevo@test.com',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Al menos 6 caracteres'),
      'Secure1',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Repetí tu contraseña'),
      'Secure1',
    );
    fireEvent.press(screen.getByText('Crear Cuenta'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        { email: 'nuevo@test.com', password: 'Secure1' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  // ──── Loading state ────────────────────────────────────────────────

  it('botón muestra spinner durante loading', () => {
    mockUseAuthValue = createMockUseAuth({ isLoading: true });

    renderRegisterScreen();

    expect(screen.getByLabelText('Cargando...')).toBeOnTheScreen();
    expect(screen.queryByText('Crear Cuenta')).not.toBeOnTheScreen();
  });

  // ──── Error banner ─────────────────────────────────────────────────

  it('error banner se muestra cuando hay error', () => {
    mockUseAuthValue = createMockUseAuth({
      error: 'El email ya está registrado',
      status: 'unauthenticated',
    });

    renderRegisterScreen();

    expect(screen.getByText('El email ya está registrado')).toBeOnTheScreen();
  });

  // ──── Navegación a Login ────────────────────────────────────────────

  it('link "Ya tenés cuenta" navega a Login', () => {
    renderRegisterScreen();

    fireEvent.press(screen.getByText('¿Ya tenés cuenta? Iniciá Sesión'));

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
