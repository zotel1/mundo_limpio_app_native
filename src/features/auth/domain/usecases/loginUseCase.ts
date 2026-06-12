import { AuthRepository } from '../ports/authRepository';
import { AuthSession, LoginRequest } from '../models';

// WHAT: Caso de uso — Login de usuario
// WHY: Orquesta la validación de credenciales y el llamado al repositorio.
//      La UI solo llama a execute() sin conocer detalles de HTTP o storage.
// BENEFITS: Testeable con mock del repositorio, validaciones en domain

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(request: LoginRequest): Promise<AuthSession> {
    // Validaciones de dominio
    if (!request.email || !request.email.includes('@')) {
      throw new Error('El email es requerido y debe ser válido');
    }
    if (!request.password || request.password.length === 0) {
      throw new Error('La contraseña es requerida');
    }

    return this.authRepository.login(request);
  }
}
