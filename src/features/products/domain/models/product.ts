// WHAT: Entidad de dominio que representa un producto del catálogo
// WHY: Single source of truth para datos del producto.
//      Capa domain: NO depende de React, RN, Axios, Zustand ni TanStack.
// BENEFITS: Tipo inmutable, serializable, fácil de mockear en tests

export interface Product {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly minPrice: number;
  readonly active: boolean;
}

// WHAT: Factory para crear Product desde parámetros tipados
// WHY: Centraliza la lógica de creación — si el backend cambia un campo,
//      solo se actualiza este factory.
// BENEFITS: Validación implícita vía TypeScript. Un solo punto de construcción.
export function createProduct(params: {
  id: number;
  sku: string;
  name: string;
  minPrice: number;
  active: boolean;
}): Product {
  return {
    id: params.id,
    sku: params.sku,
    name: params.name,
    minPrice: params.minPrice,
    active: params.active,
  };
}
