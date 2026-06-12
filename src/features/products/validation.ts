/**
 * ProductRequestSchema — Schema Zod compartido para validación de producto.
 *
 * WHAT: Schema Zod para validar datos de creación/edición de productos.
 *       Define las reglas: SKU formato (mayúsculas+números+guiones),
 *       nombre requerido, precio mínimo positivo.
 * WHY: Una sola fuente de verdad para validación. Usado tanto por
 *      infrastructure/api/dtos (validación server-side) como por
 *      presentation/screens/ProductFormScreen (validación client-side).
 *      Al estar en la raíz de la feature, es accesible desde todas las
 *      capas sin violar la regla de dependencia hexagonal.
 * BENEFITS: Sin duplicación de reglas de validación. Si el backend cambia
 *           el formato de SKU, se actualiza en un solo lugar.
 *
 * Fix C2: Movido desde infrastructure/api/dtos para resolver violación
 *         hexagonal (presentation importaba de infrastructure).
 */
import { z } from 'zod';

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
