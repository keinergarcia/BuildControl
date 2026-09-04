-- =============================================
-- MIGRATION 007 — RLS budget_categories + endurecimiento idempotente
-- =============================================
-- Objetivos (aditivo y seguro; aplica también sobre entornos que ya corrieron 006):
--  1. RLS-1: habilitar ROW LEVEL SECURITY en budget_categories y garantizar
--     lectura global (catálogo compartido). Con el REVOKE de escritura de 002,
--     las mutaciones quedan denegadas por defecto (DefaultDeny) con o sin rol.
--  2. REG-03: CHECK contracts_total_value_positive idempotente (por si 006 se
--     aplicó a un entorno antes de ser idempotente). Pre-condición: no pueden
--     existir contratos con total_value <= 0.
--  3. REG-02: índice compuesto para audit_logs (user_id, created_at DESC) que
--     respalda el feed de actividad filtrado por usuario (BUG-009).
-- Pre-condición de despliegue (007): antes de aplicar, ejecutar
--   SELECT id, total_value FROM public.contracts WHERE total_value <= 0;
-- Si devuelve filas, corregir ese contrato o detener el despliegue: el CHECK
-- fallará a propósito. NO silenciarlo con NOT VALID.

-- =============================================
-- 1) RLS-1: budget_categories (catálogo global de solo lectura)
-- =============================================
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- La política SELECT global ya existe (002: "Catalog is readable by all users").
-- Se añade una explícita para anon/authenticated para que la concesión de
-- lectura sea auditable sin depender de PUBLIC. Múltiples políticas SELECT se
-- combinan con OR, así que no hay cambio de comportamiento.
CREATE POLICY budget_categories_select ON public.budget_categories
  FOR SELECT TO anon, authenticated
  USING (true);

-- Las mutaciones ya estaban revocadas (002: REVOKE INSERT, UPDATE, DELETE).
-- Con RLS habilitado y sin política de escritura, Postgres aplica DefaultDeny:
-- INSERT/UPDATE/DELETE -> permission denied para anon y authenticated.

-- =============================================
-- 2) REG-03: CHECK de contratos idempotente
-- =============================================
-- Se replica lo que 006 hace (DROP del older >= 0 + ADD del > 0) de forma
-- idempotente, para entornos donde 006 ya se aplicó con su versión original.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contracts_total_value_nonneg'
      AND conrelid = 'public.contracts'::regclass
  ) THEN
    ALTER TABLE public.contracts DROP CONSTRAINT contracts_total_value_nonneg;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contracts_total_value_positive'
      AND conrelid = 'public.contracts'::regclass
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_total_value_positive CHECK (total_value > 0);
  END IF;
END
$$;

-- =============================================
-- 3) REG-02: índice del feed de actividad (BUG-009)
-- =============================================
CREATE INDEX IF NOT EXISTS audit_logs_user_id_created_at_idx
  ON public.audit_logs (user_id, created_at DESC);