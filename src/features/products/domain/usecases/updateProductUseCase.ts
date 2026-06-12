import type { ProductRepository } from '../ports/productRepository';
import type { Product } from '../models/product';
import type { ProductFormData } from '../models/productFormData';

// WHAT: Caso de uso — Actualizar un producto existente
// WHY: Validar id > 0 y las mismas reglas de negocio que create (SKU, name, minPrice)
//      antes de delegar al repositorio.
// BENEFITS: Reutiliza las mismas validaciones de CreateProductUseCase.
//           Permite modificar SKU sin afectar la integridad del dominio.
export class UpdateProductUseCase {
  private static readonly SKU_REGEX = /^[A-Z0-9-]+$/;

  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: number, data: ProductFormData): Promise<Product> {
    if (id <= 0) {
      throw new Error('El ID del producto debe ser mayor a 0');
    }

    this.validateSku(data.sku);
    this.validateName(data.name);
    this.validateMinPrice(data.minPrice);

    return this.productRepository.update(id, data);
  }

  private validateSku(sku: string): void {
    if (!UpdateProductUseCase.SKU_REGEX.test(sku)) {
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
