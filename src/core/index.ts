/**
 * Core — Infraestructura compartida.
 *
 * WHAT: Módulos transversales usados por todas las features.
 *       NO contiene lógica de negocio — solo herramientas técnicas.
 * WHY: Centralizar la infraestructura evita duplicación y asegura
 *      consistencia en configuraciones de red, storage, queries, etc.
 * BENEFITS: Single source of truth para configuraciones técnicas.
 *
 * Módulos:
 * - config/    → AppConfig (BASE_URL, timeouts, page sizes)
 * - http/      → Axios instance + auth interceptor + error hierarchy
 * - storage/   → Keychain tokens + MMKV key-value
 * - query/     → TanStack QueryClient + query key factory
 * - navigation/→ React Navigation container + typed routes
 * - theme/     → Design tokens (colors, typography, spacing)
 * - components/→ UI kit reutilizable (BrandedAppBar, ErrorBanner, etc.)
 * - hooks/     → Hooks genéricos (useDebounce, usePagination)
 */
export {};
