/**
 * WHAT: Tests unitarios para AuthSession y createAuthSession
 * WHY: Validar que la entidad de dominio es inmutable, correctamente
 *      creada, y que el factory centraliza la lógica de construcción.
 * BENEFITS: Si el backend cambia el schema, solo se actualiza el factory.
 */

import { createAuthSession } from '@features/auth/domain/models/authSession';
import type { AuthSession } from '@features/auth/domain/models/authSession';

describe('AuthSession', () => {
  describe('createAuthSession', () => {
    it('debe crear una sesión con todos los campos provistos', () => {
      const session: AuthSession = createAuthSession({
        userId: 42,
        username: 'operador_stock',
        email: 'op@mundolimpio.com',
        roles: ['STOCK_OPERATOR'],
      });

      expect(session.userId).toBe(42);
      expect(session.username).toBe('operador_stock');
      expect(session.email).toBe('op@mundolimpio.com');
      expect(session.roles).toEqual(['STOCK_OPERATOR']);
    });

    it('debe asignar el userId provisto correctamente', () => {
      const session = createAuthSession({
        userId: 99,
        username: 'admin',
        roles: ['ADMIN'],
      });

      expect(session.userId).toBe(99);
    });

    it('debe tener email null si no se provee', () => {
      const session = createAuthSession({
        userId: 1,
        username: 'testuser',
        roles: ['CUSTOMER'],
      });

      expect(session.email).toBeNull();
    });

    it('debe hacer que roles sea inmutable (Object.freeze)', () => {
      const session = createAuthSession({
        userId: 1,
        username: 'testuser',
        roles: ['CUSTOMER'],
      });

      expect(() => {
        // Intentar mutar el array congelado
        (session.roles as string[]).push('ADMIN');
      }).toThrow();
    });

    it('AuthSession debe ser readonly (no se pueden mutar campos en TS)', () => {
      // Este test verifica que TypeScript no permita mutaciones en compile-time.
      // En runtime no lanza error automáticamente, pero verificamos
      // que los campos existen y el tipo es correcto.
      const session: AuthSession = createAuthSession({
        userId: 1,
        username: 'testuser',
        roles: ['CUSTOMER'],
      });

      // Verificar que el objeto tiene exactamente las propiedades esperadas
      expect(Object.keys(session).sort()).toEqual(
        ['email', 'roles', 'userId', 'username'].sort(),
      );

      // Verificar que roles es efectivamente una copia (no muta el original)
      const rolesOriginal = ['STOCK_MANAGER'];
      const session2 = createAuthSession({
        userId: 2,
        username: 'manager',
        roles: rolesOriginal,
      });

      // Si el factory mutara el array original, esto fallaría:
      expect(rolesOriginal).toEqual(['STOCK_MANAGER']);
      expect(session2.roles).toEqual(['STOCK_MANAGER']);
      // Pero NO son la misma referencia (se hizo copia)
      expect(session2.roles).not.toBe(rolesOriginal);
    });
  });
});
