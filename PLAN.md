# MundoLimpio App Native — Plan de Implementación

## Estado actual: Fase 1 completada ✅

### Ramas
- `main` — producción (Fase 1 lista para merge)
- `develop` — integración (9 PRs mergeados)

---

## Fases completadas

### Fase 0 — Scaffold inicial ✅
| PR | Contenido | Tests | Estado |
|----|-----------|-------|--------|
| 0 | React Native bare, TS strict, ESLint hexagonal, Jest + RNTL + MSW, CI, estructura carpetas | smoke test | ✅ merged |

### Fase 1 — Core + Auth ✅
| PR | Contenido | Tests | Estado |
|----|-----------|-------|--------|
| 1.1 | `core/config` + `core/theme` | 66 | ✅ merged |
| 1.2 | `core/http` (apiClient + apiException) | 59 | ✅ merged |
| 1.3 | `core/storage` (TokenStorage) + `authInterceptor` (JWT dedup) | 42 | ✅ merged |
| 1.4 | `core/query` (TanStack Query) + `core/navigation/types` | 71 | ✅ merged |
| 1.5 | `core/navigation` (RootNavigator + auth guard) | 10 | ✅ merged |
| 1.6 | `feature/auth/domain` (models + ports + usecases) + `.gitattributes` | 15 | ✅ merged |
| 1.7 | `feature/auth/infrastructure` (API + DTOs Zod + adapter) | 33 | ✅ merged |
| 1.8 | `feature/auth/presentation` (AuthStore + useAuth hook) | 34 | ✅ merged |
| 1.9 | `feature/auth/presentation` (LoginScreen + RegisterScreen + HomeScreen) | 35 | ✅ merged |

**Total Fase 1: ~3,500 líneas | 365 tests | 9 PRs**

---

## Fases pendientes

### Fase 2 — Products (~1,800 líneas)
| PR | Contenido | Est. |
|----|-----------|------|
| 2.1 | `feature/products/domain` (models + ports + usecases) | ~250 |
| 2.2 | `feature/products/infrastructure` (API 8 endpoints + DTOs Zod + adapter) | ~350 |
| 2.3 | `feature/products/presentation` — store + hooks + ProductsListScreen (FlashList, búsqueda, swipe-to-delete) | ~400 |
| 2.4 | `feature/products/presentation` — ProductDetailScreen + ProductFormScreen (crear/editar, optimistic update con rollback) | ~400 |

### Fase 3 — Inventory + SyncService (~2,000 líneas)
| PR | Contenido |
|----|-----------|
| 3.1 | domain + infrastructure |
| 3.2 | presentation + MMKV offline queue |
| 3.3 | SyncService (drena cola con backoff exponencial) |

### Fase 4 — Sales (~2,200 líneas)
| PR | Contenido |
|----|-----------|
| 4.1 | domain + infrastructure |
| 4.2 | SalesCreateScreen (wizard 3 pasos) + borradores offline MMKV |
| 4.3 | SalesHistoryScreen + SaleDetailScreen |

### Fase 5 — Receipts (~1,600 líneas)
| PR | Contenido |
|----|-----------|
| 5.1 | domain + infrastructure (multipart upload, modelo preserva OCR) |
| 5.2 | ReceiptCaptureScreen + ReceiptReviewScreen + ReceiptConfirmedScreen |

### Fase 6 — Production + Users + Backups (~2,400 líneas)
| PR | Contenido |
|----|-----------|
| 6.1 | BulkProduct CRUD (7 endpoints) |
| 6.2 | ProductionBatch CRUD (4 endpoints) + ExecuteProduction use case |
| 6.3 | Users (lista, roles ADMIN exclusivity, reset password) |
| 6.4 | Backups (crear, listar, descargar streaming) |

### Fase 7 — Notifications + Pulido (~1,200 líneas)
| PR | Contenido |
|----|-----------|
| 7.1 | Firebase Cloud Messaging (inyección, no estáticos) |
| 7.2 | Release workflow (build APK → Firebase Distribution) |
| 7.3 | Tests de integración + revisión hexagonal final |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.76+ (Bare) |
| Lenguaje | TypeScript 5.x `strict: true` |
| Estado global | Zustand |
| Estado servidor | TanStack Query v5 |
| HTTP | Axios 1.x con interceptors |
| Routing | React Navigation v7 (type-safe) |
| Validación | React Hook Form + Zod |
| Storage cifrado | react-native-keychain (JWT) |
| Storage rápido | react-native-mmkv |
| Testing | Jest + RNTL + MSW |

## Arquitectura

```
Clean Architecture + Hexagonal (Ports & Adapters)

domain/          → PUERTOS: entidades + interfaces + use cases
infrastructure/  → ADAPTADORES: API, storage, implementaciones
presentation/    → UI: screens + Zustand stores + hooks
application/     → Casos de uso (orquestan puertos)
```

## Git Flow

```
feature/fase-X → commits work-unit → push → PR → develop → CI ✅ → PR → main
```

- Conventional commits en español
- Código comentado con WHAT/WHY/BENEFITS
- PRs ≤400 líneas

## Backend

Spring Boot 3.3.0 + PostgreSQL 16 — 40 endpoints REST. **Cero cambios necesarios.**

---

_Última actualización: 12 Jun 2026 — Fase 1 completada_
