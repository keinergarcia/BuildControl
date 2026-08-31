# BuildControl

**Plataforma inteligente para gestionar, controlar y rentabilizar obras de construcción.**

Construction Technology SaaS. Cada peso. Cada trabajador. Cada día. Bajo control.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind 4 + shadcn/ui + Motion + TanStack Query + Recharts + React Hook Form + Zod
- **Backend/Datos:** Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Testing:** Vitest + React Testing Library (+ Playwright en fases posteriores)

## Estructura

```
src/
├── app/          # providers, router, shell
├── components/   # ui/ layout/ shared/
├── engine/       # Motor financiero (funciones puras + tests) — fuente única de verdad
├── features/     # auth, dashboard, ...
├── lib/          # supabase, money (COP), utils
├── types/        # enums + interfaces
├── utils/
└── styles/       # globals.css (Design System dark/light)
supabase/
├── migrations/   # migraciones SQL versionadas (001, 002, ...)
├── seed_demo.sql # seed parametrizado con placeholder __USER_ID__
scripts/
└── seed-demo.mjs # helper para cargar el seed sobre un usuario REAL de auth.users
```

## Base de datos

Las migraciones se aplican sobre el proyecto de Supabase. Cada cambio de esquema
se añade como nueva migración versionada (no se edita la BD a mano).

Migraciones:
- `001_initial_schema.sql` — 17 tablas + RLS + triggers de `updated_at`.
- `002_rls_audit_views.sql` — catálogo global de solo lectura, trigger de
  auditoría financiera, vistas de solo-lectura para agregados.

### Motor financiero

La rentabilidad y el flujo de dinero son conceptos SEPARADOS (no se mezclan):

- **Rentabilidad** = valor del contrato − costos (gastos + pagos a trabajadores).
- **Flujo de dinero** = recibido − costos pagados − retiros personales.

El motor vive en `src/engine/calculations.ts` como funciones puras testeadas
(única fuente de verdad). Las vistas SQL solo agregan datos crudos, sin duplicar
esa lógica.

## Variables de entorno

**Frontend** (`.env.local`, nunca commitear):

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

**Backend/seed** (`.env.backend`, nunca commitear — solo se usa en scripts Node):

```
SUPABASE_DB_TOKEN=sbp_...            # token de acceso a la BD
SUPABASE_PROJECT_REF=<ref-del-proyecto>
```

## Puesta en marcha

```bash
npm install
npm run dev
```

Test / build / lint:

```bash
npm test
npm run build
npm run lint
```

### Cargar datos de demostración

1. **Regístrate** en la aplicación (crea tu cuenta real de Supabase Auth).
2. Una vez registrado, corre el helper con TU email:

```bash
node --env-file=.env.backend scripts/seed-demo.mjs tu@email.com
```

El helper toma el id real de tu usuario en `auth.users`, sustituye el placeholder
del seed y carga los datos de demostración "Casa Rodríguez" asociados a TU cuenta
(respeta RLS y la relación `profiles → auth.users`; no fuerza usuarios ficticios).

Para re-ejecutar (borra antes los IDs demo): añade `--reset`.

> Nota: el seed NO se aplica automáticamente. Espera a que exista un usuario
> registrado para ejecutarlo.
