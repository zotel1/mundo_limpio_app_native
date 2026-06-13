import type { Inventory } from '../models/inventory';
import type { StockAdjustment } from '../models/stockAdjustment';

// WHAT: Puerto de inventario — contrato entre domain e infrastructure
// WHY: La capa domain define QUÉ se necesita (consultar stock, ajustar),
//      infrastructure define CÓMO (Axios, Zod, mappers).
//      Mismo patrón hexagonal de auth y products.
// BENEFITS: UI y use cases no conocen HTTP, Zod ni Axios.
//           Fácil de mockear en tests de use cases y presentation.

export interface InventoryRepository {
  /**
   * Obtiene el inventario de un producto por su ID.
   * @param productId ID del producto
   * @returns Inventario del producto
   * @throws NotFoundException si el producto no existe (404)
   * @throws NetworkException si no hay conexión
   * @throws ServerException si el backend falla (5xx)
   */
  getByProductId(productId: number): Promise<Inventory>;

  /**
   * Obtiene todos los productos con stock por debajo del umbral mínimo.
   * @returns Lista de inventarios con stock bajo
   * @throws NetworkException si no hay conexión
   * @throws ServerException si el backend falla (5xx)
   */
  getLowStock(): Promise<Inventory[]>;

  /**
   * Ajusta el stock de un producto (incremento o decremento).
   * La convención de signo está en StockAdjustment: positivo=incremento,
   * negativo=decremento.
   * @param productId ID del producto a ajustar
   * @param adjustment Datos del ajuste (tipo, cantidad con signo, razón)
   * @returns Inventario actualizado después del ajuste
   * @throws ValidationException si los datos son inválidos (400)
   * @throws NotFoundException si el producto no existe (404)
   * @throws AuthException si el usuario no tiene permisos (403)
   * @throws ConflictException si hay modificación concurrente (409)
   * @throws NetworkException si no hay conexión
   * @throws ServerException si el backend falla (5xx)
   */
  adjustStock(productId: number, adjustment: StockAdjustment): Promise<Inventory>;
}
