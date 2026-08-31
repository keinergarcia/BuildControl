-- =============================================
-- 002_auto_user_id.sql
-- Asigna user_id automáticamente (auth.uid()) en INSERT
-- cuando la columna no se envía, preservando valores explícitos (seed).
-- Esto permite que las inserciones desde la app cumplan RLS
-- (WITH CHECK auth.uid() = user_id) sin hardcodear user_id en el cliente.
-- =============================================

CREATE OR REPLACE FUNCTION set_auto_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := COALESCE(NEW.user_id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients', 'projects', 'contracts', 'project_budgets',
    'expense_categories', 'suppliers', 'expenses', 'workers',
    'worker_assignments', 'worker_payments', 'income_payments',
    'personal_withdrawals', 'documents', 'project_daily_records',
    'audit_logs'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_auto_user_id_trg ON %I;', t
    );
    EXECUTE format(
      'CREATE TRIGGER set_auto_user_id_trg BEFORE INSERT ON %I
       FOR EACH ROW EXECUTE FUNCTION set_auto_user_id();', t
    );
  END LOOP;
END $$;
