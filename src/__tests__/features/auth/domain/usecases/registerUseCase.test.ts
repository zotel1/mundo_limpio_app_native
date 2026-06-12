/**
 * WHAT: Tests unitarios para RegisterUseCase
 * WHY: Validar reglas de negocio de registro: fortaleza de contraseña,
 *      email válido, delegación correcta al repositorio.
 * BENEFITS: Reglas de validación centralizadas y testeables sin dependencias externas.
 */

import { RegisterUseCase } from '@features/auth/domain/usecases/registerUseCase';
import type { AuthRepository } from '@features/auth/domain/ports/authRepository';
import type { AuthSession } from '@features/auth/domain/models/authSession';

describe('RegisterUseCase', () => {
  const mockSession: AuthSession = {
    userId: 99,
    username: 'nuevo_usuario',
    email: 'nuevo@mundolimpio.com',
    roles: ['CUSTOMER'],
  };

  const createMockRepo = (): jest.Mocked<AuthRepository> => ({
    login: jest.fn(),
    register: jest.fn().mockResolvedValue(mockSession),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    isLoggedIn: jest.fn(),
    restoreSession: jest.fn(),
  });

  it('execute con email y password fuertes debe llamar al repositorio', async () => {
    const mockRepo = createMockRepo();
    const useCase = new RegisterUseCase(mockRepo);

    const result = await useCase.execute({
      email: 'nuevo@mundolimpio.com',
      password: 'SecurePass1',
    });

    expect(mockRepo.register).toHaveBeenCalledTimes(1);
    expect(mockRepo.register).toHaveBeenCalledWith({
      email: 'nuevo@mundolimpio.com',
      password: 'SecurePass1',
    });
    expect(result).toEqual(mockSession);
  });

  it('execute con password de 5 chars debe lanzar Error (mínimo 6)', async () => {
    const mockRepo = createMockRepo();
    const useCase = new RegisterUseCase(mockRepo);

    await expect(
      useCase.execute({ email: 'test@mundolimpio.com', password: 'Abc1d' }),
    ).rejects.toThrow(
      'La contraseña debe tener al menos 6 caracteres, ' +
        'una mayúscula, una minúscula y un número',
    );

    expect(mockRepo.register).not.toHaveBeenCalled();
  });

  it('execute con password sin mayúscula debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new RegisterUseCase(mockRepo);

    await expect(
      useCase.execute({
        email: 'test@mundolimpio.com',
        password: 'todominusculas1',
      }),
    ).rejects.toThrow(
      'La contraseña debe tener al menos 6 caracteres, ' +
        'una mayúscula, una minúscula y un número',
    );

    expect(mockRepo.register).not.toHaveBeenCalled();
  });

  it('execute con password sin número debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new RegisterUseCase(mockRepo);

    await expect(
      useCase.execute({
        email: 'test@mundolimpio.com',
        password: 'SinNumeros',
      }),
    ).rejects.toThrow(
      'La contraseña debe tener al menos 6 caracteres, ' +
        'una mayúscula, una minúscula y un número',
    );

    expect(mockRepo.register).not.toHaveBeenCalled();
  });

  it('execute con email inválido debe lanzar Error', async () => {
    const mockRepo = createMockRepo();
    const useCase = new RegisterUseCase(mockRepo);

    await expect(
      useCase.execute({ email: 'no-es-email', password: 'SecurePass1' }),
    ).rejects.toThrow('El email es requerido y debe ser válido');

    expect(mockRepo.register).not.toHaveBeenCalled();
  });
});
