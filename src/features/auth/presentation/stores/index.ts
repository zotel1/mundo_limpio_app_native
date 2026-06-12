/**
 * Stores — Barrel de stores Zustand para la feature auth.
 */

export {
  useAuthStore,
  selectIsLoading,
  selectIsAuthenticated,
  selectStatus,
  selectSession,
  selectError,
  selectRoles,
  selectUsername,
} from './authStore';
export type { AuthStatus } from './authStore';
