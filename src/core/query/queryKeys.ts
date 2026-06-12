/**
 * QueryKeys — Factory de claves de caché tipadas por feature.
 *
 * WHAT: Objeto centralizado con todas las query keys de TanStack Query,
 *       organizadas por feature y entidad.
 * WHY: Evita strings mágicas distribuidas en la app, colisiones de caché
 *      entre features, y permite invalidación precisa (ej: invalidar todas
 *      las queries de "products"). Las keys son el identificador único del
 *      caché — centralizarlas garantiza type-safety y sin typos.
 * BENEFITS: Auto-completado en IDE, invalidación segura (sin strings),
 *           sin colisiones entre features, refactors seguros con TypeScript.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: { active?: boolean }) =>
      [...queryKeys.products.all, 'list', filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) =>
      [...queryKeys.products.all, 'detail', id] as const,
    bySku: (sku: string) =>
      [...queryKeys.products.all, 'sku', sku] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    detail: (productId: number) =>
      [...queryKeys.inventory.all, 'detail', productId] as const,
    lowStock: () => [...queryKeys.inventory.all, 'lowStock'] as const,
  },
  sales: {
    all: ['sales'] as const,
    lists: () => [...queryKeys.sales.all, 'list'] as const,
    details: () => [...queryKeys.sales.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.sales.all, 'detail', id] as const,
    drafts: () => [...queryKeys.sales.all, 'drafts'] as const,
  },
  receipts: {
    all: ['receipts'] as const,
    lists: () => [...queryKeys.receipts.all, 'list'] as const,
    details: () => [...queryKeys.receipts.all, 'detail'] as const,
    detail: (id: number) =>
      [...queryKeys.receipts.all, 'detail', id] as const,
  },
  production: {
    all: ['production'] as const,
    bulkProducts: {
      all: ['production', 'bulkProducts'] as const,
      lists: () =>
        [...queryKeys.production.bulkProducts.all, 'list'] as const,
      detail: (id: number) =>
        [...queryKeys.production.bulkProducts.all, 'detail', id] as const,
    },
    batches: {
      all: ['production', 'batches'] as const,
      lists: () => [...queryKeys.production.batches.all, 'list'] as const,
      detail: (id: number) =>
        [...queryKeys.production.batches.all, 'detail', id] as const,
      byProduct: (productId: number) =>
        [...queryKeys.production.batches.all, 'byProduct', productId] as const,
    },
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.users.all, 'detail', id] as const,
  },
  backups: {
    all: ['backups'] as const,
    lists: () => [...queryKeys.backups.all, 'list'] as const,
  },
} as const;
