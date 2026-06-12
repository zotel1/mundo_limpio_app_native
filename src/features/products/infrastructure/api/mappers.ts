/**
 * Mappers — Funciones puras de mapeo DTO ↔ Domain para products.
 *
 * WHAT: Funciones puras que transforman datos entre capas.
 *       - ProductResponseDto → Product (domain)
 *       - ProductFormData → ProductRequestDto (API)
 *       - ProductPageDto → estructura paginada de dominio
 * WHY: El adapter recibe DTOs validados de la API y los convierte a entidades
 *      de dominio. La capa domain nunca ve DTOs ni Zod.
 * BENEFITS: Si el backend cambia un campo del response, solo se actualiza
 *           este mapper. Domain, use cases y presentation no se tocan.
 */
import { createProduct } from '../../domain/models/product';
import type { Product } from '../../domain/models/product';
import type { ProductFormData } from '../../domain/models/productFormData';
import type {
  ProductResponseDto,
  ProductRequestDto,
  ProductPageDto,
} from './dtos';

/**
 * WHAT: Convierte un DTO de respuesta de API a una entidad Product del dominio.
 * WHY: El adapter recibe datos crudos del backend (Zod validados) y necesita
 *      transformarlos al modelo que entiende el dominio.
 *      Usa createProduct() para centralizar la construcción.
 * BENEFITS: Domain no conoce la forma exacta del JSON del backend.
 *           Si el backend agrega/renombra campos, solo se toca este mapper.
 */
export function mapProductResponseToDomain(dto: ProductResponseDto): Product {
  return createProduct({
    id: dto.id,
    sku: dto.sku,
    name: dto.name,
    minPrice: dto.minPrice,
    active: dto.active,
  });
}

/**
 * WHAT: Convierte datos del formulario de dominio a un DTO de request para la API.
 * WHY: La capa de presentación trabaja con ProductFormData (domain).
 *      Antes de enviar a la API, el adapter lo convierte a ProductRequestDto
 *      que luego será validado por Zod en ProductApi.
 * BENEFITS: El domain desconoce la existencia de DTOs de request.
 *           Presentación nunca importa ProductRequestDto.
 */
export function mapDomainToProductRequest(
  data: ProductFormData,
): ProductRequestDto {
  return {
    sku: data.sku,
    name: data.name,
    minPrice: data.minPrice,
  };
}

/**
 * WHAT: Convierte una página paginada de API a estructura plana de dominio.
 * WHY: El ProductRepository del dominio retorna `Product[]` sin metadatos
 *      de paginación. La API retorna un PageDto con content + metadata.
 *      Este mapper extrae el content y expone totalPages/totalElements
 *      para que el adapter pueda decidir qué retornar.
 * BENEFITS: El adapter controla qué metadatos exponer al dominio.
 *           Domain no conoce la estructura de paginación del backend de Spring.
 */
export function mapProductPageToDomain(pageDto: ProductPageDto): {
  products: Product[];
  totalPages: number;
  totalElements: number;
} {
  return {
    products: pageDto.content.map(mapProductResponseToDomain),
    totalPages: pageDto.totalPages,
    totalElements: pageDto.totalElements,
  };
}
