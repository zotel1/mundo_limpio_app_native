import type { Product } from '../models/product';
import type { ProductFormData } from '../models/productFormData';

// WHAT: Puerto de productos — contrato entre domain e infrastructure
// WHY: La capa domain define QUÉ se necesita (operaciones CRUD), infrastructure
//      define CÓMO (Axios, Zod, mappers). Mismo patrón hexagonal de auth.
// BENEFITS: UI y use cases no conocen HTTP, Zod ni Axios.
//           Fácil de mockear en tests de use cases y presentation.

export interface ProductRepository {
  /**
   * Obtiene productos activos paginados (vista normal del operador).
   * @param page Número de página (0-based)
   * @param size Cantidad de items por página
   * @returns Lista de productos activos
   * @throws NetworkException si no hay conexión
   * @throws ServerException si el backend falla (5xx)
   */
  getAllActive(page: number, size: number): Promise<Product[]>;

  /**
   * Obtiene TODOS los productos (activos e inactivos) paginados.
   * Solo para ADMIN y STOCK_MANAGER.
   * @param page Número de página (0-based)
   * @param size Cantidad de items por página
   * @returns Lista de todos los productos
   * @throws NetworkException si no hay conexión
   * @throws ServerException si el backend falla (5xx)
   * @throws AuthException si el usuario no tiene permisos (403)
   */
  getAll(page: number, size: number): Promise<Product[]>;

  /**
   * Obtiene un producto por su ID.
   * @param id ID del producto
   * @returns Producto encontrado
   * @throws NotFoundException si el producto no existe (404)
   * @throws NetworkException si no hay conexión
   */
  getById(id: number): Promise<Product>;

  /**
   * Busca un producto por su SKU exacto (case-sensitive).
   * Usado internamente para validar unicidad en create/update.
   * @param sku Código SKU del producto
   * @returns Producto encontrado
   * @throws NotFoundException si el SKU no existe (404)
   * @throws NetworkException si no hay conexión
   */
  getBySku(sku: string): Promise<Product>;

  /**
   * Crea un nuevo producto.
   * @param data Datos del producto a crear
   * @returns Producto creado con ID asignado por el backend
   * @throws ConflictException si el SKU ya existe (409)
   * @throws ValidationException si los datos son inválidos (400)
   * @throws NetworkException si no hay conexión
   */
  create(data: ProductFormData): Promise<Product>;

  /**
   * Actualiza un producto existente.
   * @param id ID del producto a actualizar
   * @param data Nuevos datos del producto
   * @returns Producto actualizado
   * @throws NotFoundException si el producto no existe (404)
   * @throws ConflictException si el nuevo SKU ya existe en otro producto (409)
   * @throws ValidationException si los datos son inválidos (400)
   * @throws NetworkException si no hay conexión
   */
  update(id: number, data: ProductFormData): Promise<Product>;

  /**
   * Elimina un producto (soft-delete: marca active=false).
   * @param id ID del producto a eliminar
   * @throws NotFoundException si el producto no existe (404)
   * @throws NetworkException si no hay conexión
   */
  delete(id: number): Promise<void>;

  /**
   * Reactiva un producto previamente eliminado (soft-delete inverso).
   * @param id ID del producto a reactivar
   * @throws NotFoundException si el producto no existe (404)
   * @throws ConflictException si el producto ya está activo (409)
   * @throws NetworkException si no hay conexión
   */
  reactivate(id: number): Promise<void>;
}
