/**
 * DTOs Zod — Schemas de validación para requests/responses de auth.
 *
 * WHAT: Zod schemas para validar request/response del backend.
 *       Equivalente a los modelos con json_serializable del Flutter.
 * WHY: Zod valida en runtime que la respuesta del backend tenga la forma
 *      esperada. Si el backend cambia un campo, Zod lanza error claro
 *      en vez de undefined silencioso.
 * BENEFITS: Tipos TypeScript inferidos automáticamente, validación runtime,
 *           mensajes de error claros en español.
 */
import { z } from 'zod';

// ──── Request DTOs ────

// WHAT: Schema Zod para login request
export const LoginRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

// WHAT: Schema Zod para register request
export const RegisterRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;

// WHAT: Schema Zod para refresh request
export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});
export type RefreshRequestDto = z.infer<typeof RefreshRequestSchema>;

// ──── Response DTO ────

// WHAT: Schema Zod para auth response (login, register, refresh)
// WHY: Valida que el backend devuelva todos los campos esperados.
//      Si el backend cambia, Zod atrapa el error en runtime.
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  roles: z.array(z.string()),
  username: z.string(),
  email: z.string().email().optional().nullable(),
  userId: z.number().int().positive().optional().nullable(),
});
export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;

// WHAT: Schema Zod para GET /auth/me — perfil del usuario autenticado.
// WHY: A diferencia de AuthResponse, NO incluye accessToken ni refreshToken.
//      Solo retorna los datos del perfil para restaurar la sesión.
export const MeResponseSchema = z.object({
  userId: z.number().int().positive(),
  username: z.string(),
  email: z.string().email().optional().nullable(),
  roles: z.array(z.string()),
});
export type MeResponseDto = z.infer<typeof MeResponseSchema>;
