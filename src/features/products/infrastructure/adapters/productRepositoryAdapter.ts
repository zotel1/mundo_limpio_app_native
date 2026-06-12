/**
 * ProductRepositoryAdapter — Implementación concreta del puerto ProductRepository.
 *
 * WHAT: Adapter que implementa el puerto ProductRepository definido en domain.
 *       Orquesta ProductApi (HTTP) + mappers (DTO ↔ Domain) para las 8 operaciones CRUD.
 * WHY: Conecta el puerto de dominio (ProductRepository) con la API HTTP (ProductApi).
 *      Es el único punto donde se acoplan los DTOs de infraestructura con los modelos
 *      de dominio. La capa domain nunca ve Zod, Axios, ni DTOs.
 * BENEFITS: Si la API cambia (endpoints, formato de response), solo se modifica este
 *           adapter y los mappers. Domain, use cases y presentation no se tocan.
 */
import type { ProductRepository } from '../../domain/ports/productRepository';
import type { Product } from '../../domain/models/product';
import type { ProductFormData } from '../../domain/models/productFormData';
import type { ProductApi } from '../api/productApi';
import {
  mapProductResponseToDomain,
  mapDomainToProductRequest,
  mapProductPageToDomain,
} from '../api/mappers';

export class ProductRepositoryAdapter implements ProductRepository {
  constructor(private readonly productApi: ProductApi) {}

  /**
   * Obtiene productos activos paginados.
   * Delega en ProductApi.getAllActive y extrae solo el array de productos.
   * @param page Número de página (0-based)
   * @param size Cantidad de items por página
   * @returns Lista de productos activos
   */
  async getAllActive(page: number, size: number): Promise<Product[]> {
    const pageDto = await this.productApi.getAllActive(page, size);
    const { products } = mapProductPageToDomain(pageDto);
    return products;
  }

  /**
   * Obtiene TODOS los productos (activos e inactivos) paginados.
   * Delega en ProductApi.getAll y extrae solo el array de productos.
   * @param page Número de página (0-based)
   * @param size Cantidad de items por página
   * @returns Lista de todos los productos
   */
  async getAll(page: number, size: number): Promise<Product[]> {
    const pageDto = await this.productApi.getAll(page, size);
    const { products } = mapProductPageToDomain(pageDto);
    return products;
  }

  /**
   * Obtiene un producto por su ID.
   * Delega en ProductApi.getById y mapea el response DTO a Product de dominio.
   * @param id ID del producto
   * @returns Producto encontrado
   */
  async getById(id: number): Promise<Product> {
    const dto = await this.productApi.getById(id);
    return mapProductResponseToDomain(dto);
  }

  /**
   * Busca un producto por su SKU exacto.
   * Delega en ProductApi.getBySku y mapea el response DTO a Product de dominio.
   * @param sku Código SKU del producto
   * @returns Producto encontrado
   */
  async getBySku(sku: string): Promise<Product> {
    const dto = await this.productApi.getBySku(sku);
    return mapProductResponseToDomain(dto);
  }

  /**
   * Crea un nuevo producto.
   * Convierte ProductFormData → ProductRequestDto, delega en ProductApi.create,
   * y mapea el response DTO a Product de dominio.
   * @param data Datos del producto a crear
   * @returns Producto creado con ID asignado por el backend
   */
  async create(data: ProductFormData): Promise<Product> {
    const requestDto = mapDomainToProductRequest(data);
    const responseDto = await this.productApi.create(requestDto);
    return mapProductResponseToDomain(responseDto);
  }

  /**
   * Actualiza un producto existente.
   * Convierte ProductFormData → ProductRequestDto, delega en ProductApi.update,
   * y mapea el response DTO a Product de dominio.
   * @param id ID del producto a actualizar
   * @param data Nuevos datos del producto
   * @returns Producto actualizado
   */
  async update(id: number, data: ProductFormData): Promise<Product> {
    const requestDto = mapDomainToProductRequest(data);
    const responseDto = await this.productApi.update(id, requestDto);
    return mapProductResponseToDomain(responseDto);
  }

  /**
   * Elimina un producto (soft-delete).
   * Delega en ProductApi.delete. No hay body que mapear (204 No Content).
   * @param id ID del producto a eliminar
   */
  async delete(id: number): Promise<void> {
    await this.productApi.delete(id);
  }

  /**
   * Reactiva un producto previamente eliminado.
   * Delega en ProductApi.reactivate. No hay body que mapear (204 No Content).
   * @param id ID del producto a reactivar
   */
  async reactivate(id: number): Promise<void> {
    await this.productApi.reactivate(id);
  }
}
