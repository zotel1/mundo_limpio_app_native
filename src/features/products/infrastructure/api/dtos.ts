/**
 * DTOs Zod — Schemas de validación para requests/responses de products.
 *
 * WHAT: Zod schemas para validar request/response del backend de productos.
 *       Equivalente a los modelos con json_serializable del Flutter.
 * WHY: Zod valida en runtime que la respuesta del backend tenga la forma
 *      esperada. Si el backend cambia un campo, Zod lanza error claro
 *      en vez de undefined silencioso.
 * BENEFITS: Tipos TypeScript inferidos automáticamente, validación runtime,
 *           mensajes de error claros.
 */
import { z } from 'zod';

// ──── Request DTOs ────

/**
 * WHAT: Schema Zod para crear o editar un producto.
 * WHY: Valida que el SKU cumpla el formato esperado por el backend
 *      (mayúsculas, números y guiones), que el nombre no esté vacío,
 *      y que minPrice sea positivo.
 */
export const ProductRequestSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU es requerido')
    .regex(
      /^[A-Z0-9-]+$/,
      'SKU must contain only uppercase letters, numbers, and hyphens',
    ),
  name: z.string().min(1, 'Nombre es requerido'),
  minPrice: z.number().positive('Precio mínimo debe ser positivo'),
});

/** WHAT: Tipo inferido del schema ProductRequest. */
export type ProductRequestDto = z.infer<typeof ProductRequestSchema>;

// ──── Response DTO ────

/**
 * WHAT: Schema Zod para la respuesta de un producto individual.
 * WHY: Valida que el backend devuelva todos los campos esperados.
 *      Si el backend cambia, Zod atrapa el error en runtime.
 */
export const ProductResponseSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  minPrice: z.number(),
  active: z.boolean(),
});

/** WHAT: Tipo inferido del schema ProductResponse. */
export type ProductResponseDto = z.infer<typeof ProductResponseSchema>;

// ──── Page DTO ────

/**
 * WHAT: Schema Zod para respuesta paginada de productos.
 * WHY: El backend de Spring retorna Page<Product> con esta estructura.
 *      Valida tanto la página como cada producto dentro de content.
 */
export const ProductPageSchema = z.object({
  content: z.array(ProductResponseSchema),
  totalPages: z.number(),
  totalElements: z.number(),
  number: z.number(),
  size: z.number(),
});

/** WHAT: Tipo inferido del schema ProductPage. */
export type ProductPageDto = z.infer<typeof ProductPageSchema>;
