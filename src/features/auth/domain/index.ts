/**
 * Domain — Capa de dominio (interior de la arquitectura hexagonal).
 *
 * REGLA DE ORO: domain/ NO puede importar nada de:
 *   - React, React Native
 *   - Axios, TanStack Query, Zustand
 *   - React Navigation, React Hook Form
 *   - infrastructure/, presentation/
 *
 * domain/ solo depende de:
 *   - TypeScript puro (tipos, interfaces)
 *   - Zod (opcional, para schemas de validación de dominio)
 *   - Otros módulos dentro de domain/ (models → ports → usecases)
 *
 * Estructura de cada feature:
 *   models/    → Entidades, value objects, tipos puros
 *   ports/     → Interfaces (contratos) que infrastructure/ debe implementar
 *   usecases/  → Casos de uso — lógica de negocio pura
 *
 * BENEFITS: Esta restricción asegura que la lógica de negocio sea
 *           independiente de frameworks, portable y 100% testeable.
 */
export {};
