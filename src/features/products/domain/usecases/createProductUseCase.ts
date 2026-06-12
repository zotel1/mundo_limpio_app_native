import type { ProductRepository } from '../ports/productRepository';
import type { Product } from '../models/product';
import type { ProductFormData } from '../models/productFormData';

// WHAT: Caso de uso — Crear un nuevo producto
// WHY: Centraliza las reglas de validación de dominio (SKU, nombre, precio mínimo)
//      antes de delegar al repositorio. La UI no conoce estas reglas.
// BENEFITS: Reglas de negocio en un solo lugar. Fácil de testear sin HTTP.
export class CreateProductUseCase {
  private static readonly SKU_REGEX = /^[A-Z0-9-]+$/;

  constructor(private readonly productRepository: ProductRepository) {}

  async execute(data: ProductFormData): Promise<Product> {
    this.validateSku(data.sku);
    this.validateName(data.name);
    this.validateMinPrice(data.minPrice);

    return this.productRepository.create(data);
  }

  private validateSku(sku: string): void {
    if (!CreateProductUseCase.SKU_REGEX.test(sku)) {
      throw new Error(
        'El SKU debe contener solo mayusculas, numeros y guiones (ej: PROD-001)',
      );
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('El nombre del producto es requerido');
    }
  }

  private validateMinPrice(minPrice: number): void {
    if (minPrice <= 0) {
      throw new Error('El precio minimo debe ser mayor a 0');
    }
  }
}
