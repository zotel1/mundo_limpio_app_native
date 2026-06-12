// WHAT: Value object para datos de formulario de producto — dominio puro
// WHY: Separa la forma de los datos de formulario (mutables) del modelo Product
//      (inmutable). El formulario necesita campos editables antes de submit.
// BENEFITS: Tipado claro para formularios. Factory asegura estado inicial consistente.

export interface ProductFormData {
  sku: string;
  name: string;
  minPrice: number;
}

// WHAT: Factory que crea un ProductFormData vacío para inicializar formularios
// WHY: Estado inicial predecible para React Hook Form o formularios controlados.
//      Evita undefined/null y asegura que todos los campos existen desde el inicio.
// BENEFITS: Sin sorpresas de undefined. Tipado completo desde el primer render.
export function createEmptyProductFormData(): ProductFormData {
  return {
    sku: '',
    name: '',
    minPrice: 0,
  };
}
