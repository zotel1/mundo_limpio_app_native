# MundoLimpio App Native

Frontend mobile de MundoLimpio construido con **React Native** y **TypeScript**, migrado desde Flutter. Gestión completa de inventario, producción, ventas y recibos para productos de limpieza.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.76+ (Bare, NO Expo) |
| Lenguaje | TypeScript 5.x (`strict: true`) |
| Estado global | Zustand |
| Estado servidor | TanStack Query v5 |
| HTTP | Axios 1.x con interceptors |
| Routing | React Navigation v7 (type-safe) |
| Validación | React Hook Form + Zod |
| Storage cifrado | react-native-keychain (JWT) |
| Storage rápido | react-native-mmkv |
| Testing | Jest + React Native Testing Library + MSW |
| CI/CD | GitHub Actions |

## Arquitectura

**Clean Architecture + Hexagonal (Ports & Adapters)** con 4 capas estrictas:

```
domain/          → PUERTOS: entidades puras + interfaces + casos de uso
infrastructure/  → ADAPTADORES: implementaciones concretas (Axios, Keychain, MMKV)
presentation/    → UI: React components + Zustand stores + TanStack Query hooks
application/     → Casos de uso (orquestan puertos, sin deps externas)
```

**Regla de oro**: `domain/` NO importa nada de React, React Native, Axios, Zustand, ni TanStack Query. Solo TypeScript puro.

## Estructura del Proyecto

```
src/
├── core/                     # Infraestructura compartida
│   ├── config/               # URLs, timeouts, staleTimes
│   ├── http/                 # Axios client + auth interceptor (JWT dedup)
│   ├── storage/              # TokenStorage (Keychain) + MMKV
│   ├── query/                # TanStack QueryClient + query keys
│   ├── navigation/           # React Navigation setup + auth guard
│   ├── theme/                # Design tokens (colores, tipografía, spacing)
│   └── components/           # Componentes UI compartidos
├── features/                 # Features por dominio
│   └── {feature}/
│       ├── domain/           # models/ + ports/ + usecases/
│       ├── infrastructure/   # api/ + storage/ + adapters/
│       └── presentation/     # screens/ + stores/ + hooks/ + components/
└── App.tsx                   # Entry point + providers
```

## Features

| Feature | Endpoints | Descripción |
|---------|-----------|-------------|
| **Auth** | 3 | Login, registro, JWT refresh, HomeScreen por rol (7 roles) |
| **Products** | 8 | CRUD completo, búsqueda, soft delete, optimistic updates |
| **Inventory** | 3 | Consulta stock, low-stock alerts, ajustes offline |
| **Sales** | 3 | Crear venta, borradores offline, historial |
| **Receipts** | 4 | OCR de recibos, cámara, revisión, confirmación |
| **Production** | 11 | BulkProduct CRUD + ProductionBatch CRUD + use cases |
| **Users** | 4 | Admin: listar, roles, reset password |
| **Notifications** | — | Firebase Cloud Messaging (post-MVP) |
| **Admin/Backup** | 3 | Crear, listar, descargar backups |
| **Splash** | 1 | Health check + animación interactiva |

**Total: 40 endpoints REST** consumidos desde el backend Spring Boot.

## Backend

El backend es un servicio Spring Boot 3.3.0 + PostgreSQL 16 con JWT y RBAC (7 roles), desplegado en Render. **Cero cambios necesarios** — REST puro, agnóstico al cliente.

## Flujo de Trabajo

### Git Flow

```
feature/fase-X → commits work-unit → push → PR → develop → CI ✅ → PR → main
```

### Ramas

- `main` — producción (protegida)
- `develop` — integración
- `feature/*` — nuevas implementaciones (una por fase)

### Commits

**Conventional commits en español**:

```
feat(scope): descripción de lo implementado

- WHAT: qué se implementó
- WHY: por qué esta solución
- BENEFITS: qué beneficios trae
```

### CI/CD

- **PR a develop**: `tsc --noEmit` + `eslint` + `jest` + coverage gate 70%
- **Merge a main**: build APK → Firebase App Distribution

## Cómo Empezar

### Requisitos

- Node.js 20+
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Instalación

```bash
git clone https://github.com/zotel1/mundo_limpio_app_native.git
cd mundo_limpio_app_native
npm install
npx react-native start
```

### Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```env
BASE_URL=https://mundo-limpio-backend.onrender.com
```

### Tests

```bash
npm test              # Suite completa
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

## Licencia

Privado — Todos los derechos reservados.
