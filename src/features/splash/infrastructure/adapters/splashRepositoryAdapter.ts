/**
 * SplashRepositoryAdapter — Health check HTTP contra GET /actuator/health.
 *
 * WHAT: Adaptador concreto que implementa SplashRepository usando Axios
 *       (publicClient) para verificar que el backend Spring Boot está UP.
 * WHY: Encapsula la llamada HTTP. Si falla (error, timeout, status != 200),
 *      retorna false en lugar de lanzar excepción — la splash screen decide
 *      qué mostrar según el booleano.
 * BENEFITS: Inyectable — recibe el cliente Axios por constructor, fácil
 *           de mockear en tests. Aislado — el dominio no sabe de HTTP.
 *
 * TDD: GREEN — implementación mínima para pasar splashRepositoryAdapter.test.ts.
 */

import { AxiosInstance } from 'axios';
import type { SplashRepository } from '../../domain/ports/splashRepository';

export class SplashRepositoryAdapter implements SplashRepository {
  private readonly client: AxiosInstance;

  /**
   * @param client - Instancia de Axios preconfigurada (publicClient).
   *                 Sin auth interceptor porque el health check es anónimo.
   */
  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Health check HTTP — GET /actuator/health.
   *
   * WHAT: Llama al endpoint de health de Spring Boot Actuator.
   * WHY: Verificar que el backend está operativo antes de que el usuario
   *      intente iniciar sesión. Evita UX rota si el backend está caído.
   *
   * @returns true si status === 200, false en cualquier otro caso.
   */
  async wakeBackend(): Promise<boolean> {
    try {
      const response = await this.client.get('/actuator/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
