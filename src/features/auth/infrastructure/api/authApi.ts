/**
 * AuthApi — Llamadas HTTP a los endpoints de autenticación.
 *
 * WHAT: Encapsula las llamadas Axios a /api/v1/auth/login, /auth/register,
 *       /auth/refresh. Valida request y response con Zod.
 * WHY: Una sola clase con todas las llamadas de auth, fácil de testear con
 *      mock de Axios. Equivalente a `auth_api.dart` del Flutter.
 * BENEFITS: Separación clara: HTTP + validación en un solo lugar.
 *           La capa superior (adapter) solo recibe DTOs validados.
 */
import { AxiosInstance } from 'axios';
import {
  LoginRequestDto,
  RegisterRequestDto,
  AuthResponseDto,
  LoginRequestSchema,
  RegisterRequestSchema,
  RefreshRequestSchema,
  AuthResponseSchema,
} from './dtos';

export class AuthApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Login: POST /api/v1/auth/login
   * Valida request con Zod antes de enviar.
   * Valida response con Zod antes de retornar.
   */
  async login(data: LoginRequestDto): Promise<AuthResponseDto> {
    const parsed = LoginRequestSchema.parse(data);
    const response = await this.client.post('/api/v1/auth/login', parsed);
    return AuthResponseSchema.parse(response.data);
  }

  /**
   * Register: POST /api/v1/auth/register
   * Valida request con Zod antes de enviar.
   * Valida response con Zod antes de retornar.
   */
  async register(data: RegisterRequestDto): Promise<AuthResponseDto> {
    const parsed = RegisterRequestSchema.parse(data);
    const response = await this.client.post('/api/v1/auth/register', parsed);
    return AuthResponseSchema.parse(response.data);
  }

  /**
   * Refresh: POST /api/v1/auth/refresh
   * Valida request con Zod antes de enviar.
   * Valida response con Zod antes de retornar.
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const parsed = RefreshRequestSchema.parse({ refreshToken });
    const response = await this.client.post('/api/v1/auth/refresh', parsed);
    return AuthResponseSchema.parse(response.data);
  }
}
