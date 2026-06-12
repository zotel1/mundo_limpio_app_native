/**
 * ProductApi — Llamadas HTTP a los endpoints de productos.
 *
 * WHAT: Encapsula las llamadas Axios a /api/v1/products/*.
 *       Valida request y response con Zod. Equivalente al ProductApi del Flutter.
 * WHY: Una sola clase con todas las llamadas de products, fácil de testear con
 *      mock de Axios. Sigue el mismo patrón que AuthApi.
 * BENEFITS: Separación clara: HTTP + validación en un solo lugar.
 *           La capa superior (adapter) solo recibe DTOs validados.
 */
import { AxiosInstance } from 'axios';
import {
  ProductRequestDto,
  ProductRequestSchema,
  ProductResponseDto,
  ProductResponseSchema,
  ProductPageDto,
  ProductPageSchema,
} from './dtos';

export class ProductApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Obtiene productos activos paginados: GET /api/v1/products?page=N&size=N
   * Valida la respuesta paginada con Zod antes de retornar.
   */
  async getAllActive(page: number, size: number): Promise<ProductPageDto> {
    const response = await this.client.get(
      `/api/v1/products?page=${page}&size=${size}`,
    );
    return ProductPageSchema.parse(response.data);
  }

  /**
   * Obtiene TODOS los productos (incluyendo inactivos): GET /api/v1/products/all?page=N&size=N
   * Valida la respuesta paginada con Zod antes de retornar.
   */
  async getAll(page: number, size: number): Promise<ProductPageDto> {
    const response = await this.client.get(
      `/api/v1/products/all?page=${page}&size=${size}`,
    );
    return ProductPageSchema.parse(response.data);
  }

  /**
   * Obtiene un producto por ID: GET /api/v1/products/{id}
   * Valida la respuesta con Zod antes de retornar.
   */
  async getById(id: number): Promise<ProductResponseDto> {
    const response = await this.client.get(`/api/v1/products/${id}`);
    return ProductResponseSchema.parse(response.data);
  }

  /**
   * Obtiene un producto por SKU: GET /api/v1/products/sku/{sku}
   * Valida la respuesta con Zod antes de retornar.
   */
  async getBySku(sku: string): Promise<ProductResponseDto> {
    const response = await this.client.get(`/api/v1/products/sku/${sku}`);
    return ProductResponseSchema.parse(response.data);
  }

  /**
   * Crea un producto: POST /api/v1/products
   * Valida el request con Zod antes de enviar.
   * Valida la respuesta con Zod antes de retornar.
   */
  async create(data: ProductRequestDto): Promise<ProductResponseDto> {
    const parsed = ProductRequestSchema.parse(data);
    const response = await this.client.post('/api/v1/products', parsed);
    return ProductResponseSchema.parse(response.data);
  }

  /**
   * Actualiza un producto: PUT /api/v1/products/{id}
   * Valida el request con Zod antes de enviar.
   * Valida la respuesta con Zod antes de retornar.
   */
  async update(
    id: number,
    data: ProductRequestDto,
  ): Promise<ProductResponseDto> {
    const parsed = ProductRequestSchema.parse(data);
    const response = await this.client.put(`/api/v1/products/${id}`, parsed);
    return ProductResponseSchema.parse(response.data);
  }

  /**
   * Soft-delete de un producto: DELETE /api/v1/products/{id}
   * El backend retorna 204 No Content — no hay body que validar.
   */
  async delete(id: number): Promise<void> {
    await this.client.delete(`/api/v1/products/${id}`);
  }

  /**
   * Reactiva un producto inactivo: PATCH /api/v1/products/{id}/reactivate
   * El backend retorna 204 No Content — no hay body que validar.
   */
  async reactivate(id: number): Promise<void> {
    await this.client.patch(`/api/v1/products/${id}/reactivate`);
  }
}
