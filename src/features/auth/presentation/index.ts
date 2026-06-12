/**
 * Presentation — Capa de UI y estado.
 *
 * WHAT: Componentes React Native, stores (Zustand), hooks, y pantallas.
 * WHY: Separar UI de la lógica de negocio permite testear la UI de forma aislada
 *      y cambiar el framework de UI sin reescribir el dominio.
 * BENEFITS: Componentes enfocados en renderizado. Lógica de negocio delegada a
 *           usecases. Estado manejado por stores con contratos claros.
 *
 * Estructura de cada feature:
 *   screens/     → Pantallas completas (composición de componentes)
 *   stores/      → Zustand stores (estado global de la feature)
 *   hooks/       → Custom hooks (useLogin, useProducts, etc.)
 *   components/  → Componentes reutilizables dentro de la feature
 *
 * REGLA: presentation/ NO importa directamente de infrastructure/.
 *        Usa hooks/stores que llaman a usecases (que a su vez usan ports).
 *        La conexión se hace en la Composition Root (features/index.ts).
 */
// Stores — Zustand (estado global de auth)
export {
  useAuthStore,
  selectIsLoading,
  selectIsAuthenticated,
  selectStatus,
  selectSession,
  selectError,
  selectRoles,
  selectUsername,
} from './stores';
export type { AuthStatus } from './stores';

// Hooks — TanStack Query + Store (orquestación de auth)
export { useAuth } from './hooks';
