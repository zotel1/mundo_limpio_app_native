// WHAT: Entidad de dominio que representa un ajuste de stock
// WHY: Convención de signo centralizada: cantidad positiva = incremento,
//      cantidad negativa = decremento. Tipos explícitos (ADJUSTMENT,
//      BREAKAGE, RETURN, QUALITY_LOSS) para distinguir causas.
// BENEFITS: Inmutable, serializable, fácil de mockear en tests.
//           Los consumidores no necesitan interpretar el signo — está definido acá.

export interface StockAdjustment {
  readonly type: string;
  readonly quantity: number;
  readonly reason: string;
}

// WHAT: Factory para crear StockAdjustment desde parámetros tipados
// WHY: Centraliza la lógica de creación — si se agregan nuevos tipos de
//      ajuste, solo se actualiza este factory.
// BENEFITS: Validación implícita vía TypeScript. Un solo punto de construcción.
export function createStockAdjustment(params: {
  type: string;
  quantity: number;
  reason: string;
}): StockAdjustment {
  return {
    type: params.type,
    quantity: params.quantity,
    reason: params.reason,
  };
}
