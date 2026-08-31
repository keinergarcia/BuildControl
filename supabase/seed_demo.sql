-- =============================================
-- SEED DEMO — BuildControl (parametrizado y seguro)
-- =============================================
-- Propósito: cargar datos de demostración para UN usuario real registrado en
-- auth.users. No fuerza perfiles ficticios y NO toca RLS ni FKs.
--
-- CÓMO SE USA:
--   Este archivo contiene el placeholder __USER_ID__, que el helper
--   `scripts/seed-demo.mjs` sustituye por el id REAL del usuario registrado
--   (obtenido de auth.users por su email) antes de ejecutarlo en la BD.
--   Así el profile coincide con un usuario de auth.users y las filas quedan
--   asociadas correctamente (user_id), visibles bajo RLS para ese usuario.
--
--   Ejecución manual opcional:
--     sed "s/__USER_ID__/<tu-user-id-real>/g" supabase/seed_demo.sql
--
-- SEGURIDAD:
--   * Solo se usa el id de un usuario que YA existe en auth.users.
--   * Los IDs ficticios de clients/projects/... son estables para que las
--     relaciones (FK) se resuelvan; NINGÚN id hace referencia a auth.users.
--   * No elimina datos. Es idempotente (ON CONFLICT DO NOTHING en claves).
-- =============================================

-- ---------- Profile del usuario real ----------
INSERT INTO profiles (id, full_name, email, company_name, currency)
VALUES (
  '__USER_ID__',
  'Carlos Rodríguez',
  'carlos@buildcontrol.demo',
  'Rodríguez Construcciones',
  'COP'
) ON CONFLICT (id) DO NOTHING;

-- ---------- Clientes ----------
INSERT INTO clients (id, user_id, name, company, phone, email, address)
VALUES
  ('10000000-0000-0000-0000-000000000001', '__USER_ID__',
   'María García', 'García Inmobiliaria', '+57 300 123 4567', 'maria@garcia.com',
   'Cra 15 #80-20, Bogotá'),
  ('10000000-0000-0000-0000-000000000002', '__USER_ID__',
   'Andrés López', NULL, '+57 310 987 6543', 'andres@lopez.com',
   'Calle 72 #10-15, Medellín'),
  ('10000000-0000-0000-0000-000000000003', '__USER_ID__',
   'Sofía Martínez', 'Constructora Martínez', '+57 320 555 1234', 'sofia@martinez.co',
   'Av El Dorado #68B-35, Bogotá');

-- ---------- Proyectos ----------
INSERT INTO projects (id, user_id, client_id, name, description, location, project_type, status, start_date, planned_end_date)
VALUES
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__', '10000000-0000-0000-0000-000000000001',
   'Casa Rodríguez', 'Construcción vivienda unifamiliar de 2 pisos',
   'Cra 15 #80-20, Bogotá', 'residencial', 'activo', '2026-01-15', '2026-07-15'),
  ('20000000-0000-0000-0000-000000000002', '__USER_ID__', '10000000-0000-0000-0000-000000000002',
   'Bodega Industrial', 'Bodega de 500m² en zona industrial',
   'Zona Industrial, Medellín', 'industrial', 'activo', '2026-03-01', '2026-09-30'),
  ('20000000-0000-0000-0000-000000000003', '__USER_ID__', '10000000-0000-0000-0000-000000000003',
   'Oficinas Martínez', 'Remodelación de oficinas corporativas',
   'Av El Dorado #68B-35, Bogotá', 'comercial', 'planificacion', '2026-06-01', '2026-10-15');

-- ---------- Contratos ----------
INSERT INTO contracts (id, project_id, user_id, contract_type, total_value, daily_rate, start_date, planned_end_date, conditions)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '__USER_ID__',
   'precio_fijo', 180000000, NULL, '2026-01-15', '2026-07-15',
   'Anticipo 30%, cuotas mensuales según avance'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '__USER_ID__',
   'precio_fijo', 250000000, NULL, '2026-03-01', '2026-09-30',
   'Pago por avance de obra'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '__USER_ID__',
   'pago_por_dia', 95000000, 500000, '2026-06-01', '2026-10-15', NULL);

-- ---------- Presupuestos (Casa Rodríguez) ----------
INSERT INTO project_budgets (project_id, category_id, user_id, budgeted_amount)
SELECT '20000000-0000-0000-0000-000000000001', id, '__USER_ID__', amount
FROM (VALUES
  ('Materiales', 45000000),
  ('Mano de Obra', 40000000),
  ('Transporte', 8000000),
  ('Maquinaria', 10000000),
  ('Herramientas', 5000000),
  ('Permisos', 3000000),
  ('Subcontratos', 6000000),
  ('Otros', 3000000)
) AS data(name, amount)
JOIN budget_categories bc ON bc.name = data.name;

-- ---------- Proveedores ----------
INSERT INTO suppliers (id, user_id, name, phone, email)
VALUES
  ('50000000-0000-0000-0000-000000000001', '__USER_ID__',
   'Ferretería El Martillo', '+57 300 111 2222', 'ventas@elmartillo.com'),
  ('50000000-0000-0000-0000-000000000002', '__USER_ID__',
   'Distribuidora de Acero SA', '+57 300 333 4444', 'ventas@acerosa.com'),
  ('50000000-0000-0000-0000-000000000003', '__USER_ID__',
   'Alquileres Maquinaria Pesada', '+57 300 555 6666', 'info@alquileresmp.com');

-- ---------- Gastos (Casa Rodríguez) ----------
INSERT INTO expenses (project_id, user_id, category_id, description, amount, expense_date, payment_method)
VALUES
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Materiales'),
   'Cemento Portland 500 bolsas', 12500000, '2026-01-20', 'transferencia'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Materiales'),
   'Arena y grava', 5500000, '2026-01-22', 'efectivo'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Materiales'),
   'Varillas de acero', 8200000, '2026-02-01', 'transferencia'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Transporte'),
   'Transporte de materiales', 3500000, '2026-01-25', 'efectivo'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Maquinaria'),
   'Alquiler retroexcavadora 1 mes', 4000000, '2026-02-15', 'transferencia'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Materiales'),
   'Bloques y ladrillos', 7800000, '2026-03-01', 'tarjeta_credito'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Herramientas'),
   'Herramientas básicas', 2500000, '2026-01-18', 'efectivo'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__',
   (SELECT id FROM budget_categories WHERE name = 'Permisos'),
   'Permiso de construcción', 3000000, '2026-01-16', 'transferencia');

-- ---------- Trabajadores ----------
INSERT INTO workers (id, user_id, name, role, payment_type, daily_rate, status)
VALUES
  ('40000000-0000-0000-0000-000000000001', '__USER_ID__',
   'Carlos Martínez', 'Albañil', 'diario', 80000, 'activo'),
  ('40000000-0000-0000-0000-000000000002', '__USER_ID__',
   'Pedro Sánchez', 'Ayudante', 'diario', 50000, 'activo'),
  ('40000000-0000-0000-0000-000000000003', '__USER_ID__',
   'Luis Ramírez', 'Electricista', 'diario', 95000, 'activo');

INSERT INTO worker_assignments (worker_id, project_id, user_id, start_date)
VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '__USER_ID__', '2026-01-15'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '__USER_ID__', '2026-01-15'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '__USER_ID__', '2026-03-01');

INSERT INTO worker_payments (worker_id, project_id, user_id, amount, payment_date, concept, payment_method)
VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 80000, '2026-01-16', 'Jornada día 1', 'efectivo'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 50000, '2026-01-16', 'Jornada día 1', 'efectivo'),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 80000, '2026-01-17', 'Jornada día 2', 'efectivo'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 50000, '2026-01-17', 'Jornada día 2', 'efectivo'),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 400000, '2026-01-31', 'Semana 1-2', 'transferencia'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 250000, '2026-01-31', 'Semana 1-2', 'transferencia'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 95000, '2026-03-05', 'Jornada electricidad', 'efectivo'),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 480000, '2026-02-14', 'Semana 3-6', 'transferencia'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 300000, '2026-02-14', 'Semana 3-6', 'transferencia'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '__USER_ID__', 475000, '2026-03-20', 'Semana electricista febrero', 'transferencia');

-- ---------- Ingresos ----------
INSERT INTO income_payments (project_id, client_id, user_id, amount, payment_date, concept, payment_method)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '__USER_ID__', 54000000, '2026-01-15', 'Anticipo 30%', 'transferencia'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '__USER_ID__', 36000000, '2026-02-15', 'Cuota mensual febrero', 'transferencia'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '__USER_ID__', 36000000, '2026-03-15', 'Cuota mensual marzo', 'transferencia'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '__USER_ID__', 62500000, '2026-03-01', 'Anticipo 25%', 'transferencia');

-- ---------- Retiros personales ----------
INSERT INTO personal_withdrawals (project_id, user_id, amount, withdrawal_date, reason)
VALUES
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__', 500000, '2026-02-01', 'Gastos personales'),
  ('20000000-0000-0000-0000-000000000001', '__USER_ID__', 500000, '2026-03-01', 'Gastos personales');
