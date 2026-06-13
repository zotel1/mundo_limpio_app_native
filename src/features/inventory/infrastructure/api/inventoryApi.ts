/**
 * InventoryApi — Llamadas HTTP a los endpoints de inventario.
 *
 * WHAT: Encapsula las llamadas Axios a /api/v1/inventory/{productId},
 *       /api/v1/inventory/low-stock, /api/v1/inventory/{productId}/adjust.
 *       Valida request y response con Zod.
 * WHY: Una sola clase con todas las llamadas de inventario, fácil de testear
 *      con mock de Axios. Mismo patrón que AuthApi de Fase 1 y ProductApi
 *      de Fase 2.
 * BENEFITS: Separación clara: HTTP + validación en un solo lugar.
 *           La capa superior (adapter) solo recibe DTOs validados.
 *           Los errores de Axios (4xx/5xx/red) son manejados por
 *           el interceptor global.
 */
import { AxiosInstance } from 'axios';
import { z } from 'zod';
import {
  InventoryResponseDto,
  AdjustmentRequestDto,
  InventoryResponseSchema,
  AdjustmentRequestSchema,
} from './dtos';

export class InventoryApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * getByProductId: GET /api/v1/inventory/{productId}
   *
   * Obtiene el inventario de un producto por su ID.
   * Valida la respuesta con Zod antes de retornar.
   *
   * @param productId ID del producto a consultar
   * @returns DTO con los datos de inventario del producto
   * @throws ZodError si la respuesta del backend no cumple el schema
   */
  async getByProductId(productId: number): Promise<InventoryResponseDto> {
    const response = await this.client.get(
      `/api/v1/inventory/${productId}`,
    );
    return InventoryResponseSchema.parse(response.data);
  }

  /**
   * getLowStock: GET /api/v1/inventory/low-stock
   *
   * Obtiene todos los productos con stock por debajo del umbral mínimo.
   * Valida la respuesta con Zod (array de InventoryResponse) antes de retornar.
   *
   * @returns Array de DTOs con los datos de inventario de productos con stock bajo
   * @throws ZodError si la respuesta del backend no cumple el schema
   */
  async getLowStock(): Promise<InventoryResponseDto[]> {
    const response = await this.client.get('/api/v1/inventory/low-stock');
    return z.array(InventoryResponseSchema).parse(response.data);
  }

  /**
   * adjustStock: POST /api/v1/inventory/{productId}/adjust
   *
   * Ajusta el stock de un producto (incremento o decremento).
   * Valida el request con Zod ANTES de enviar la llamada HTTP.
   * Valida la respuesta con Zod antes de retornar.
   *
   * @param productId ID del producto a ajustar
   * @param data Datos del ajuste (type, quantity con signo, reason)
   * @returns DTO con los datos de inventario actualizados
   * @throws ZodError si el request o la respuesta no cumplen los schemas
   */
  async adjustStock(
    productId: number,
    data: AdjustmentRequestDto,
  ): Promise<InventoryResponseDto> {
    const parsed = AdjustmentRequestSchema.parse(data);
    const response = await this.client.post(
      `/api/v1/inventory/${productId}/adjust`,
      parsed,
    );
    return InventoryResponseSchema.parse(response.data);
  }
}
