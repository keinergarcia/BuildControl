-- =============================================
-- MIGRATION 006 — Endurecimiento financiero post-auditoría QA
-- =============================================
-- Objetivo: corregir hallazgos de la auditoría QA (03 Sep 2026).
--  1. BUG-002: contratos deben tener valor estrictamente > 0 (la regla anterior
--     era >= 0, permitiendo contratos de $0 que corrompen métricas).
--  3. Quitar GRANT SELECT a anon sobre vistas agregadas financieras (superficie
--     innecesaria; solo authenticated debe leerlas).
--  4. Índice sobre projects.user_id (acelerar joins y RLS).
-- Aditivo y seguro: no elimina datos, no desactiva RLS, no toca FKs.
-- Nota: el ADD CONSTRAINT es idempotente; si en algún entorno existieran
-- contratos con valor 0, fallará (a propósito) para forzar su limpieza antes
-- de aplicarla en producción. La defensa del feed de actividad (BUG-009) —filtro
-- user_id en el cliente + índice audit_logs(user_id, created_at DESC)— vive en
-- la migración 007 (006 puede no haberse aplicado aún en algún entorno).

-- =============================================
-- 1) BUG-002: contratos con valor > 0
-- =============================================
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_total_value_nonneg;

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
-- 3) Vistas agregadas: solo authenticated, quitar anon
-- =============================================
REVOKE SELECT ON public.v_project_financial_aggregates FROM anon;
REVOKE SELECT ON public.v_project_budget_status FROM anon;

-- =============================================
-- 4) Índice acelerador para RLS/joins por usuario
-- =============================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
