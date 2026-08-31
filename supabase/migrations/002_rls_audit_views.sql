-- =============================================
-- MIGRATION 002 — Seguridad, Auditoría y Catálogos
-- =============================================
-- Objetivos:
--  1. Habilitar lectura del catálogo global budget_categories (sin escritura).
--  2. Proteger el catálogo global contra escritura desde el frontend.
--  3. Trigger genérico de auditoría para tablas financieras (nada de
--     modificaciones silenciosas de dinero).
--  4. Vistas de solo-lectura para agregados financieros que el frontend
--     puede consumir sin duplicar lógica de negocio por fila.
-- Aditivo y seguro: no elimina datos, no elimina columnas, no desactiva RLS.

-- =============================================
-- 1) budget_categories: catálogo GLOBAL de solo lectura
-- =============================================
-- RLS está habilitado pero no había política -> tabla bloqueada incluso para SELECT.
-- Es un catálogo compartido por todos los usuarios (materiales, mano de obra...),
-- las líneas de presupuesto (project_budgets.category_id) hacen referencia a él.
CREATE POLICY "Catalog is readable by all users"
  ON public.budget_categories
  FOR SELECT
  USING (true);

-- El catálogo lo administra el sistema (migraciones/seed), no los clientes.
-- PostgREST usa los roles anon/authenticated; revocar escritura evita
-- insert/update/delete desde el frontend aunque alguien intente otra política.
REVOKE INSERT, UPDATE, DELETE ON public.budget_categories FROM anon, authenticated;
REVOKE ALL ON public.budget_categories FROM public;
GRANT SELECT ON public.budget_categories TO anon, authenticated;

-- =============================================
-- 2) Trigger genérico de auditoría
-- =============================================
-- Registra en audit_logs cada operación (INSERT/UPDATE/DELETE) sobre tablas
-- financieras críticas. user_id se toma del JWT del request (funciona bajo
-- SECURITY DEFINER porque el JWT viaja como GUC request.jwt.claims).
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
BEGIN
  actor := nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  VALUES (
    actor,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_project_budgets
  AFTER INSERT OR UPDATE OR DELETE ON public.project_budgets
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_income_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.income_payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_worker_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.worker_payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_personal_withdrawals
  AFTER INSERT OR UPDATE OR DELETE ON public.personal_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- NOTA: metadata de tipos de pago (workers, clients...) no genera auditoría
-- financiera para no saturar el log; las tablas de dinero sí son críticas.

-- =============================================
-- 3) Vistas de solo-lectura para agregados financieros
-- =============================================
-- Devuelven sumas brutas por proyecto. La lógica de negocio (utilidad, margen,
-- proyectado, flujo) vive en una única fuente de verdad en el frontend
-- (src/engine/calculations.ts). Estas vistas solo agregan datos crudos para
-- consultas rápidas; NO duplican el motor de rentabilidad.

CREATE VIEW public.v_project_financial_aggregates AS
SELECT
  p.id AS project_id,
  COALESCE(cont.total_value, 0) AS contract_value,
  COALESCE(inc.total_received, 0) AS total_received,
  COALESCE(exp.total_expenses, 0) AS total_expenses,
  COALESCE(wp.total_worker_payments, 0) AS total_worker_payments,
  COALESCE(wd.total_withdrawals, 0) AS total_withdrawals,
  COALESCE(bg.total_budget, 0) AS total_budget
FROM public.projects p
LEFT JOIN LATERAL (
  SELECT SUM(c.total_value)::numeric AS total_value
  FROM public.contracts c WHERE c.project_id = p.id
) cont ON true
LEFT JOIN LATERAL (
  SELECT SUM(i.amount)::numeric AS total_received
  FROM public.income_payments i WHERE i.project_id = p.id
) inc ON true
LEFT JOIN LATERAL (
  SELECT SUM(e.amount)::numeric AS total_expenses
  FROM public.expenses e WHERE e.project_id = p.id
) exp ON true
LEFT JOIN LATERAL (
  SELECT SUM(w.amount)::numeric AS total_worker_payments
  FROM public.worker_payments w WHERE w.project_id = p.id
) wp ON true
LEFT JOIN LATERAL (
  SELECT SUM(w2.amount)::numeric AS total_withdrawals
  FROM public.personal_withdrawals w2 WHERE w2.project_id = p.id
) wd ON true
LEFT JOIN LATERAL (
  SELECT SUM(pb.budgeted_amount)::numeric AS total_budget
  FROM public.project_budgets pb WHERE pb.project_id = p.id
) bg ON true;

-- RLS en vistas: se aplica el RLS de las tablas base, por lo que cada usuario
-- solo ve agregados de SUS proyectos. Reforzamos explícitamente:
ALTER VIEW public.v_project_financial_aggregates SET (security_invoker = true);
GRANT SELECT ON public.v_project_financial_aggregates TO authenticated, anon;

-- Vista: estado de gasto real por categoría de presupuesto por proyecto.
-- (Útil para el dashboard de presupuesto sin duplicar lógica.)
CREATE VIEW public.v_project_budget_status AS
SELECT
  pb.project_id,
  pb.category_id,
  bc.name AS category_name,
  bc.color AS category_color,
  pb.budgeted_amount,
  COALESCE(SUM(e.amount) FILTER (WHERE e.category_id = pb.category_id), 0)::numeric AS spent_amount
FROM public.project_budgets pb
JOIN public.budget_categories bc ON bc.id = pb.category_id
LEFT JOIN public.expenses e ON e.project_id = pb.project_id
GROUP BY pb.project_id, pb.category_id, bc.name, bc.color, pb.budgeted_amount;

ALTER VIEW public.v_project_budget_status SET (security_invoker = true);
GRANT SELECT ON public.v_project_budget_status TO authenticated, anon;
