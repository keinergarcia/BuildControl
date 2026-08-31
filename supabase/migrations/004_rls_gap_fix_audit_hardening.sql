-- =============================================
-- MIGRATION 004 — Cierre de brechas RLS y endurecimiento de auditoría
-- =============================================
-- Objetivos (aditivo y seguro; no elimina tablas, no desactiva RLS):
--  1. Cerrar la brecha de RLS cruzada en expenses.supplier_id: un usuario no
--     debe poder referenciar el proveedor (supplier) de OTRO usuario en sus
--     gastos.
--  2. Cerrar la brecha de RLS cruzada en project_daily_records.project_id:
--     un usuario no debe poder crear registros diarios sobre proyectos ajenos.
--  3. Endurecer audit_logs: revocar DML directo a roles de cliente para que la
--     auditoría solo sea escrita por el trigger SECURITY DEFINER (que opera como
--     el dueño de la función y no depende de grants de authenticated/anon).
--     Así un usuario NO puede insertar/actualizar/borrar logs (ni siquiera los
--     suyos), y los logs de OTROS usuarios son invariantes (SELECT propio).

-- =============================================
-- 1) expenses -> supplier (pertenencia del proveedor)
-- =============================================
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
    AND (supplier_id IS NULL OR EXISTS (
      SELECT 1 FROM public.suppliers s WHERE s.id = supplier_id AND s.user_id = auth.uid()
    ))
  );

-- =============================================
-- 2) project_daily_records -> project (pertenencia del proyecto)
-- =============================================
DROP POLICY IF EXISTS "Users can CRUD own daily records" ON public.project_daily_records;
CREATE POLICY "Users can CRUD own daily records" ON public.project_daily_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

-- =============================================
-- 3) audit_logs: solo escritura por trigger (SECURITY DEFINER)
-- =============================================
-- El trigger public.audit_trigger() es SECURITY DEFINER: escribe como el dueño
-- de la función y NO necesita grants de authenticated/anon. Al revocar el DML
-- directo a los roles de cliente, la auditoría se vuelve de solo-append vía
-- trigger: un usuario no puede fabricar ni alterar registros de auditoría.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.audit_logs FROM anon, authenticated;

-- Se conserva la lectura de los logs propios (el usuario puede auditar lo suyo).
GRANT SELECT ON public.audit_logs TO authenticated;

-- El rol public no recibe nada.
REVOKE ALL ON public.audit_logs FROM public;
