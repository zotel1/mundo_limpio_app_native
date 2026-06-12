import { AuthRepository } from '../ports/authRepository';
import { AuthSession, RegisterRequest } from '../models';

// WHAT: Caso de uso — Registro de usuario
// WHY: Validación de fortaleza de contraseña en la capa de dominio.
//      Mismo patrón que validators.dart del Flutter.
// BENEFITS: Reglas de negocio centralizadas, no dispersas en la UI

export class RegisterUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(request: RegisterRequest): Promise<AuthSession> {
    // Validaciones de dominio
    if (!request.email || !request.email.includes('@')) {
      throw new Error('El email es requerido y debe ser válido');
    }

    // Validación de fortaleza: ≥6 chars, al menos 1 mayúscula, 1 minúscula, 1 dígito
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(request.password)) {
      throw new Error(
        'La contraseña debe tener al menos 6 caracteres, ' +
        'una mayúscula, una minúscula y un número',
      );
    }

    return this.authRepository.register(request);
  }
}
