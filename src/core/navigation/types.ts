/**
 * RootStackParamList — Tipos de navegación de React Navigation v7.
 *
 * WHAT: Definición tipada de TODAS las rutas de la app con sus params.
 *       Equivalente a las rutas de GoRouter en Flutter, pero con
 *       type-safety en tiempo de compilación vía TypeScript.
 * WHY: Navegación 100% tipada: params validados en compilación,
 *      auto-completado en IDE, sin strings mágicas para nombres de ruta.
 *      Si una ruta cambia sus params, TypeScript rompe en todos los
 *      navigate() — cero errores en runtime.
 * BENEFITS: Refactors seguros, auto-completado en useNavigation().navigate(),
 *           sin typos en nombres de ruta, params validados por el compilador.
 *
 * TDD: GREEN — implementación mínima para pasar los tests de types.test.ts.
 */

export type RootStackParamList = {
  // Splash
  Splash: undefined;

  // Auth (público)
  Login: undefined;
  Register: undefined;

  // Home (autenticado)
  Home: undefined;

  // Products
  ProductsList: undefined;
  ProductDetail: { productId: number };
  // productId undefined = modo crear, number = modo editar
  ProductForm: { productId?: number };

  // Inventory
  InventoryList: undefined;
  InventoryDetail: { productId: number };

  // Sales
  SalesCreate: undefined;
  SalesResult: { saleId: number };
  SalesHistory: undefined;
  SaleDetail: { saleId: number };

  // Receipts
  ReceiptCapture: undefined;
  // Tipado exacto se define en el PR de receipts (ReceiptProcessResponse)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReceiptReview: { processResponse: any };
  ReceiptConfirmed: { purchaseId: number };
  ReceiptsHistory: undefined;
  ReceiptDetail: { receiptId: number };

  // Production
  BulkProductList: undefined;
  BulkProductForm: { productId?: number };
  ProductionBatchList: undefined;
  ProductionBatchCreate: undefined;

  // Users (ADMIN)
  UsersList: undefined;
  UserDetail: { userId: number };

  // Backups (ADMIN)
  BackupList: undefined;
  BackupDetail: { backupId: number };

  // Notifications (post-MVP)
  Notifications: undefined;
};

/**
 * Declaración global para que useNavigation() y useRoute() sean type-safe
 * en toda la app sin necesidad de pasar el tipo genérico cada vez.
 *
 * WHAT: Extiende la interfaz global de React Navigation para que
 *       useNavigation<NativeStackNavigationProp<RootStackParamList>>()
 *       sea automático — el tipo se infiere del módulo.
 * WHY: Evita repetir `useNavigation<NativeStackNavigationProp<RootStackParamList>>()`
 *      en cada pantalla. Con esta declaración, `useNavigation()` ya sabe
 *      todas las rutas y params.
 * BENEFITS: Menos boilerplate, menos errores de tipo, más limpio.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends RootStackParamList {}
  }
}
