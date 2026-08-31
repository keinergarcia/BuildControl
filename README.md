<p align="center">
  <img src="assets/logo.svg" alt="BuildControl" width="120" height="120" />
</p>

<h1 align="center">BuildControl</h1>

<p align="center">
  <strong>Plataforma inteligente para gestionar, controlar y rentabilizar obras de construcción.</strong>
</p>

<p align="center">
  Construction Technology SaaS. Cada peso. Cada trabajador. Cada día. Bajo control.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Zod-3-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/React%20Query-TanStack-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
</p>

---

## 🚧 Stack Tecnológico

| Capa | Tecnologías |
| --- | --- |
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui · Motion · TanStack Query · Recharts · React Hook Form · Zod |
| **Backend / Datos** | Supabase (Auth, PostgreSQL, Storage, Edge Functions) |
| **Pruebas** | Vitest + React Testing Library (+ Playwright en fases posteriores) |

---

## 📁 Estructura del Proyecto

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

---

## 🗄️ Base de Datos

Las migraciones se aplican sobre el proyecto de **Supabase**. Cada cambio de esquema se añade como una **nueva migración versionada** (no se edita la BD a mano).

**Migraciones:**

- `001_initial_schema.sql` — 17 tablas + RLS + triggers de `updated_at`.
- `002_rls_audit_views.sql` — catálogo global de solo lectura, trigger de auditoría financiera y vistas de solo-lectura para agregados.

---

## 💰 Motor Financiero

La **rentabilidad** y el **flujo de dinero** son conceptos **separados** (no se mezclan):

- **Rentabilidad** = valor del contrato − costos (gastos + pagos a trabajadores).
- **Flujo de dinero** = recibido − costos pagados − retiros personales.

El motor vive en `src/engine/calculations.ts` como **funciones puras testeadas** (única fuente de verdad). Las vistas SQL solo agregan datos crudos, **sin duplicar** esa lógica.

---

## ⚙️ Variables de Entorno

**Frontend** (`.env.local` — nunca commitear):

```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

**Backend / seed** (`.env.backend` — nunca commitear, solo se usa en scripts Node):

```env
SUPABASE_DB_TOKEN=sbp_...            # token de acceso a la BD
SUPABASE_PROJECT_REF=<ref-del-proyecto>
```

---

## 🚀 Puesta en Marcha

```bash
npm install
npm run dev
```

**Test / build / lint:**

```bash
npm test
npm run build
npm run lint
```

---

## 🧪 Cargar Datos de Demostración

1. **Regístrate** en la aplicación (crea tu cuenta real de Supabase Auth).
2. Una vez registrado, corre el helper con **tu email**:

```bash
node --env-file=.env.backend scripts/seed-demo.mjs tu@email.com
```

El helper toma el **id real** de tu usuario en `auth.users`, sustituye el placeholder del seed y carga los datos de demostración **"Casa Rodríguez"** asociados a **tu cuenta** (respeta RLS y la relación `profiles → auth.users`; no fuerza usuarios ficticios).

Para **re-ejecutar** (borra antes los IDs demo): añade `--reset`.

> **Nota:** el seed **no** se aplica automáticamente. Espera a que exista un usuario registrado para ejecutarlo.

---

## 👷 Desarrollado por

<p align="center">
  <strong>ElChivalez</strong> — Ingeniería de software y productividad para el sector construcción.
</p>

<p align="center">
  <a href="https://github.com/elchivalez"><img src="https://img.shields.io/badge/GitHub-%40elchivalez-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
</p>

<p align="center">
  <em>Construido con ❤️ para el sector de la construcción.</em>
</p>
