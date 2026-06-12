/**
 * AuthRepositoryAdapter — Implementación concreta del puerto AuthRepository.
 *
 * WHAT: Adapter que implementa el puerto AuthRepository definido en domain.
 *       Equivalente a `auth_repository_impl.dart` del Flutter.
 * WHY: Conecta el puerto (domain) con la API (infrastructure) y el storage
 *      (infrastructure). Orquesta login, register, refresh, logout.
 * BENEFITS: Único punto donde se acoplan HTTP y storage. Si cambia la API
 *           o el storage, solo se modifica este adapter.
 */
import {
  AuthRepository,
  AuthSession,
  LoginRequest,
  RegisterRequest,
} from '../../domain';
import { AuthApi } from '../api/authApi';
import { ITokenStorage } from '@core/storage/tokenStorage';
import { mapAuthResponseToSession } from '../api/mappers';
import { createAuthSession } from '../../domain';

export class AuthRepositoryAdapter implements AuthRepository {
  constructor(
    private readonly authApi: AuthApi,
    private readonly tokenStorage: ITokenStorage,
  ) {}

  async login(request: LoginRequest): Promise<AuthSession> {
    const dto = await this.authApi.login({
      email: request.email,
      password: request.password,
    });

    // Guardar tokens en storage seguro
    await this.tokenStorage.saveTokens(dto.accessToken, dto.refreshToken);

    return mapAuthResponseToSession(dto);
  }

  async register(request: RegisterRequest): Promise<AuthSession> {
    const dto = await this.authApi.register({
      email: request.email,
      password: request.password,
    });

    // R2.1: NO autentica automáticamente — NO guarda tokens
    // Pero SÍ retorna la sesión para que el provider pueda mostrar feedback
    return mapAuthResponseToSession(dto);
  }

  async refreshToken(refreshToken: string): Promise<AuthSession> {
    const dto = await this.authApi.refresh(refreshToken);

    // Actualizar tokens guardados
    await this.tokenStorage.saveTokens(dto.accessToken, dto.refreshToken);

    return mapAuthResponseToSession(dto);
  }

  async logout(): Promise<void> {
    // Limpiar tokens locales. NO llama al backend (el backend no tiene
    // endpoint de logout — solo invalidar refresh token no implementado)
    await this.tokenStorage.clear();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.tokenStorage.hasTokens();
  }

  async restoreSession(): Promise<AuthSession> {
    const dto = await this.authApi.me();

    return createAuthSession({
      userId: dto.userId,
      username: dto.username,
      email: dto.email,
      roles: dto.roles,
    });
  }
}
