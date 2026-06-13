/**
 * DTOs Zod — Schemas de validación para requests/responses de inventory.
 *
 * WHAT: Zod schemas para validar request/response del backend de inventario.
 *       Equivalente a los modelos con json_serializable del Flutter.
 * WHY: Zod valida en runtime que la respuesta del backend tenga la forma
 *      esperada. Si el backend cambia un campo, Zod lanza error claro
 *      en vez de undefined silencioso.
 * BENEFITS: Tipos TypeScript inferidos automáticamente, validación runtime,
 *           mensajes de error claros. Mismo patrón que auth y products.
 */
import { z } from 'zod';

// ──── Response DTO ────

// WHAT: Schema Zod para la respuesta del endpoint de inventario.
// WHY: Valida que el backend devuelva productId, productName, currentStock
//      y minStockThreshold en el formato esperado. Si el backend cambia,
//      Zod atrapa el error en runtime.
export const InventoryResponseSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  currentStock: z.number(),
  minStockThreshold: z.number(),
});

/** Tipo inferido de InventoryResponseSchema — DTO de respuesta del backend. */
export type InventoryResponseDto = z.infer<typeof InventoryResponseSchema>;

// ──── Request DTO ────

// WHAT: Schema Zod para la request de ajuste de stock.
// WHY: Valida que el frontend envíe type (string no vacío), quantity (número,
//      puede ser negativo para decrementos) y reason (string no vacío) antes
//      de hacer la llamada HTTP. Atrapa errores de formulario en cliente.
export const AdjustmentRequestSchema = z.object({
  type: z.string().min(1, 'El tipo de ajuste es requerido'),
  quantity: z.number(),
  reason: z.string().min(1, 'La razón del ajuste es requerida'),
});

/** Tipo inferido de AdjustmentRequestSchema — DTO de request de ajuste. */
export type AdjustmentRequestDto = z.infer<typeof AdjustmentRequestSchema>;
