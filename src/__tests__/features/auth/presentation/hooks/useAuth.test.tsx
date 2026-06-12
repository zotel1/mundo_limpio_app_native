/**
 * WHAT: Tests para el hook useAuth — orquestación AuthStore + AuthRepository + TanStack Query
 * WHY: Validar flujo login, register, logout, checkAuth con store real y repository mockeado.
 *      Las screens solo llaman login(), register(), logout() sin conocer detalles internos.
 * BENEFITS: Una sola API de auth, lógica centralizada, testable con mocks.
 *
 * TDD: RED → GREEN: test escrito antes de la implementación, ahora verifica que pasa.
 */

import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AuthRepository, AuthSession } from '@features/auth/domain';
import { useAuthStore } from '@features/auth/presentation/stores/authStore';
import { useAuth } from '@features/auth/presentation/hooks/useAuth';

// ──── Helpers ────

const mockSession: AuthSession = {
  userId: 42,
  username: 'operador_stock',
  email: 'op@mundolimpio.com',
  roles: ['STOCK_OPERATOR'],
};

const createMockRepo = (): jest.Mocked<AuthRepository> => ({
  login: jest.fn().mockResolvedValue(mockSession),
  register: jest.fn().mockResolvedValue(mockSession),
  refreshToken: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  isLoggedIn: jest.fn().mockResolvedValue(false),
});

// Wrapper con QueryClientProvider necesario para TanStack Query
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

// ──── Suite ────

describe('useAuth — hook de autenticación', () => {
  beforeEach(() => {
    // Resetear store antes de cada test
    useAuthStore.getState().reset();
  });

  // ──── login() ────

  it('login() exitoso actualiza store a authenticated con la sesión', async () => {
    const mockRepo = createMockRepo();
    mockRepo.login.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    // Ejecutar login
    await act(async () => {
      result.current.login({ email: 'test@test.com', password: 'pass123' });
    });

    // Esperar a que la mutación se complete (TanStack Query es asíncrono)
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockRepo.login).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'pass123',
    });

    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('authenticated');
    expect(storeState.session).toEqual(mockSession);
  });

  it('login() en error actualiza store a unauthenticated con mensaje', async () => {
    const mockRepo = createMockRepo();
    mockRepo.login.mockRejectedValue(new Error('Credenciales inválidas'));

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.login({ email: 'bad@test.com', password: 'wrong' });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockRepo.login).toHaveBeenCalledTimes(1);

    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('unauthenticated');
    expect(storeState.session).toBeNull();
    // Debe contener el mensaje de error
    expect(storeState.error).toBeTruthy();
  });

  // ──── register() ────

  it('register() exitoso NO autentica — store queda unauthenticated (R2.1)', async () => {
    const mockRepo = createMockRepo();
    mockRepo.register.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.register({ email: 'new@test.com', password: 'Secure1!' });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockRepo.register).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'Secure1!',
    });

    // R2.1: Registro exitoso NO autentica — store queda unauthenticated
    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('unauthenticated');
    expect(storeState.session).toBeNull();
  });

  it('register() en error actualiza store con mensaje de error', async () => {
    const mockRepo = createMockRepo();
    mockRepo.register.mockRejectedValue(new Error('El email ya existe'));

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.register({
        email: 'dupe@test.com',
        password: 'Secure1!',
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockRepo.register).toHaveBeenCalledTimes(1);

    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('unauthenticated');
    expect(storeState.error).toBeTruthy();
  });

  // ──── logout() ────

  it('logout() llama authRepository.logout y resetea store', async () => {
    const mockRepo = createMockRepo();
    // Precondición: autenticado
    useAuthStore.getState().setAuthenticated(mockSession);

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockRepo.logout).toHaveBeenCalledTimes(1);

    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('loading'); // reset → loading
    expect(storeState.session).toBeNull();
    expect(storeState.error).toBeNull();
  });

  it('logout() resetea store incluso si repository.logout falla', async () => {
    const mockRepo = createMockRepo();
    mockRepo.logout.mockRejectedValue(new Error('Error de red'));
    useAuthStore.getState().setAuthenticated(mockSession);

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.logout();
    });

    // El store se resetea en el finally — siempre
    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('loading');
    expect(storeState.session).toBeNull();
    expect(storeState.error).toBeNull();
  });

  // ──── checkAuth() ────

  it('checkAuth() con isLoggedIn=false → store queda unauthenticated', async () => {
    const mockRepo = createMockRepo();
    mockRepo.isLoggedIn.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.checkAuth();
    });

    expect(mockRepo.isLoggedIn).toHaveBeenCalledTimes(1);

    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('unauthenticated');
    expect(storeState.session).toBeNull();
  });

  it('checkAuth() con isLoggedIn=true → store queda unauthenticated (restore en PR futuro)', async () => {
    const mockRepo = createMockRepo();
    mockRepo.isLoggedIn.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.checkAuth();
    });

    expect(mockRepo.isLoggedIn).toHaveBeenCalledTimes(1);

    // Comportamiento actual: queda unauthenticated hasta implementar restoreSession
    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('unauthenticated');
  });

  it('checkAuth() en error de verificación → unauthenticated con mensaje', async () => {
    const mockRepo = createMockRepo();
    mockRepo.isLoggedIn.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.checkAuth();
    });

    const storeState = useAuthStore.getState();
    expect(storeState.status).toBe('unauthenticated');
    expect(storeState.error).toContain('Error al verificar');
  });

  // ──── clearError() ────

  it('clearError() delega en store.clearError', () => {
    const mockRepo = createMockRepo();
    useAuthStore.getState().setUnauthenticated('Error de prueba');

    const { result } = renderHook(() => useAuth({ authRepository: mockRepo }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.clearError();
    });

    expect(useAuthStore.getState().error).toBeNull();
  });
});
