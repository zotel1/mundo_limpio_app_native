/**
 * Infrastructure — Capa de adaptadores (exterior de la arquitectura hexagonal).
 *
 * WHAT: Implementaciones concretas de los puertos definidos en domain/.
 *       Aquí vive el código que habla con el mundo exterior (HTTP, storage, etc.).
 * WHY: Separar la implementación de la interfaz permite cambiar tecnologías
 *      sin tocar la lógica de negocio (ej: cambiar Axios por Fetch).
 * BENEFITS: Testeable con mocks. Swappeable. No contamina el dominio.
 *
 * Estructura de cada feature:
 *   api/         → Funciones HTTP (usa Axios, DTOs, Zod schemas)
 *   storage/     → Persistencia local (MMKV, Keychain)
 *   adapters/    → Implementan los puertos (ports) usando api + storage
 *
 * REGLA: infrastructure/ NUNCA expone DTOs fuera de esta capa.
 *        Los adapters siempre convierten DTOs ↔ modelos de dominio.
 */
export {};
