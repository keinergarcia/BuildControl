-- =============================================
-- MIGRATION 003 — Integridad, RLS cruzada y auto-perfil
-- =============================================
-- Objetivo: blindar la base de datos para producción.
--  1. CHECKs de integridad monetaria (montos >= 0) y de coherencia de fechas.
--  2. Trigger que crea el profile automáticamente al crearse un usuario
--     (mantiene profiles -> auth.users, no rompe la relación).
--  3. RLS de referencia cruzada: un usuario NO puede apuntar movimientos a
--     entidades (proyectos/clientes/trabajadores) de OTRO usuario.
--  4. Índices de key-finger para FKs sin índice.
-- Aditivo y seguro: reemplaza políticas para reforzarlas; no elimina tablas,
-- no desactiva RLS, no toca la relación profiles->auth.users.

-- =============================================
-- 1) CHECKs de integridad
-- =============================================

-- Montos en pesos colombianos (COP): nunca negativos.
ALTER TABLE public.project_budgets
  ADD CONSTRAINT project_budgets_budgeted_amount_nonneg
  CHECK (budgeted_amount >= 0);

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_total_value_nonneg CHECK (total_value >= 0),
  ADD CONSTRAINT contracts_daily_rate_nonneg CHECK (daily_rate IS NULL OR daily_rate >= 0);

ALTER TABLE public.workers
  ADD CONSTRAINT workers_daily_rate_nonneg CHECK (daily_rate IS NULL OR daily_rate >= 0);

ALTER TABLE public.worker_assignments
  ADD CONSTRAINT worker_assignments_daily_rate_override_nonneg
  CHECK (daily_rate_override IS NULL OR daily_rate_override >= 0);

-- Coherencia temporal.
ALTER TABLE public.projects
  ADD CONSTRAINT projects_planned_end_gte_start
  CHECK (planned_end_date IS NULL OR start_date IS NULL OR planned_end_date >= start_date),
  ADD CONSTRAINT projects_actual_end_gte_start
  CHECK (actual_end_date IS NULL OR start_date IS NULL OR actual_end_date >= start_date);

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_planned_end_gte_start
  CHECK (planned_end_date IS NULL OR start_date IS NULL OR planned_end_date >= start_date);

ALTER TABLE public.worker_assignments
  ADD CONSTRAINT worker_assignments_end_gte_start
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- =============================================
-- 2) Trigger: crear profile al crear usuario
-- =============================================
-- Evita perfiles huérfanos y garantiza que cada usuario registrado tenga su
-- fila en profiles (id = auth.users.id). Este es el mecanismo que el frontend
-- usa, y que el seed aprovechará usando el id real del usuario.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 3) RLS de referencia cruzada (no apuntar a datos ajenos)
-- =============================================
-- Se reemplazan las políticas FOR ALL por versiones que además validan que las
-- entidades referenciadas pertenecen al usuario. Las subconsultas respetan el
-- RLS de las tablas padre (doble capa de protección).

-- projects -> clients
DROP POLICY IF EXISTS "Users can CRUD own projects" ON public.projects;
CREATE POLICY "Users can CRUD own projects" ON public.projects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (client_id IS NULL OR EXISTS (
      SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid()
    ))
  );

-- contracts -> projects
DROP POLICY IF EXISTS "Users can CRUD own contracts" ON public.contracts;
CREATE POLICY "Users can CRUD own contracts" ON public.contracts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

-- project_budgets -> projects
DROP POLICY IF EXISTS "Users can CRUD own project budgets" ON public.project_budgets;
CREATE POLICY "Users can CRUD own project budgets" ON public.project_budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

-- expenses -> projects (y validación de modelo: categoría de presupuesto global OK)
DROP POLICY IF EXISTS "Users can CRUD own expenses" ON public.expenses;
CREATE POLICY "Users can CRUD own expenses" ON public.expenses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    AND (expense_category_id IS NULL OR expense_category_id IN (
      SELECT ec.id FROM public.expense_categories ec WHERE ec.user_id = auth.uid()
    ))
  );

-- income_payments -> projects y clientes
DROP POLICY IF EXISTS "Users can CRUD own income payments" ON public.income_payments;
CREATE POLICY "Users can CRUD own income payments" ON public.income_payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    AND (client_id IS NULL OR EXISTS (
      SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid()
    ))
  );

-- personal_withdrawals -> projects
DROP POLICY IF EXISTS "Users can CRUD own withdrawals" ON public.personal_withdrawals;
CREATE POLICY "Users can CRUD own withdrawals" ON public.personal_withdrawals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

-- worker_payments -> projects y workers
DROP POLICY IF EXISTS "Users can CRUD own worker payments" ON public.worker_payments;
CREATE POLICY "Users can CRUD own worker payments" ON public.worker_payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = worker_id AND w.user_id = auth.uid())
  );

-- worker_assignments -> projects y workers
DROP POLICY IF EXISTS "Users can CRUD own worker assignments" ON public.worker_assignments;
CREATE POLICY "Users can CRUD own worker assignments" ON public.worker_assignments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = worker_id AND w.user_id = auth.uid())
  );

-- documents -> projects (si aplica)
DROP POLICY IF EXISTS "Users can CRUD own documents" ON public.documents;
CREATE POLICY "Users can CRUD own documents" ON public.documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (project_id IS NULL OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()
    ))
  );

-- =============================================
-- 4) Índices para FKs sin índice (rendimiento)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON public.expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_category ON public.expenses(expense_category_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_user_id ON public.project_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_income_payments_user_id ON public.income_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.personal_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_user_id ON public.worker_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_assignments_user_id ON public.worker_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON public.expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_id ON public.project_daily_records(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_project ON public.project_daily_records(project_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
