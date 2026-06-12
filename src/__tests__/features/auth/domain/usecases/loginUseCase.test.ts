/**
 * WHAT: Tests unitarios para LoginUseCase
 * WHY: Validar reglas de negocio de login: email válido, password
 *      requerido, delegación correcta al repositorio.
 * BENEFITS: El use case es testeable sin HTTP ni UI — mock puro.
 */

import { LoginUseCase } from '@features/auth/domain/usecases/loginUseCase';
import type { AuthRepository } from '@features/auth/domain/ports/authRepository';
import type { AuthSession } from '@features/auth/domain/models/authSession';

describe('LoginUseCase', () => {
  // Mock del repositorio
  const mockSession: AuthSession = {
    userId: 42,
    username: 'operador_stock',
    email: 'op@mundolimpio.com',
    roles: ['STOCK_OPERATOR'],
  };

  const createMockRepo = (): jest.Mocked<AuthRepository> => ({
    login: jest.fn().mockResolvedValue(mockSession),
    register: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    isLoggedIn: jest.fn(),
    restoreSession: jest.fn(),
  });

  it('execute con email y password válidos debe llamar al repositorio', async () => {
    const mockRepo = createMockRepo();
    const useCase = new LoginUseCase(mockRepo);

    const result = await useCase.execute({
      email: 'test@mundolimpio.com',
      password: 'SecurePass1',
    });

    expect(mockRepo.login).toHaveBeenCalledTimes(1);
    expect(mockRepo.login).toHaveBeenCalledWith({
      email: 'test@mundolimpio.com',
      password: 'SecurePass1',
    });
    expect(result).toEqual(mockSession);
  });

  it('execute con email vacío debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new LoginUseCase(mockRepo);

    await expect(
      useCase.execute({ email: '', password: 'SecurePass1' }),
    ).rejects.toThrow('El email es requerido y debe ser válido');

    // El repositorio NO debe llamarse
    expect(mockRepo.login).not.toHaveBeenCalled();
  });

  it('execute con email sin @ debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new LoginUseCase(mockRepo);

    await expect(
      useCase.execute({ email: 'sin-arroba', password: 'SecurePass1' }),
    ).rejects.toThrow('El email es requerido y debe ser válido');

    expect(mockRepo.login).not.toHaveBeenCalled();
  });

  it('execute con password vacío debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new LoginUseCase(mockRepo);

    await expect(
      useCase.execute({ email: 'test@mundolimpio.com', password: '' }),
    ).rejects.toThrow('La contraseña es requerida');

    expect(mockRepo.login).not.toHaveBeenCalled();
  });

  it('execute con credenciales inválidas debe propagar error del repositorio', async () => {
    const mockRepo = createMockRepo();
    mockRepo.login.mockRejectedValue(new Error('Credenciales inválidas'));
    const useCase = new LoginUseCase(mockRepo);

    await expect(
      useCase.execute({
        email: 'test@mundolimpio.com',
        password: 'WrongPass1',
      }),
    ).rejects.toThrow('Credenciales inválidas');

    expect(mockRepo.login).toHaveBeenCalledTimes(1);
  });
});
