#!/usr/bin/env node
/**
 * Helper para cargar datos de demostración de BuildControl sobre un usuario
 * REAL registrado en auth.users. Sustituye el placeholder __USER_ID__ del
 * archivo supabase/seed_demo.sql por el id real del usuario (obtenido por email)
 * y ejecuta el SQL resultante contra la base de datos.
 *
 * Uso:
 *   node scripts/seed-demo.mjs <email-del-usuario> [--reset]
 *
 *   --reset  (opcional) limpia antes los datos DEMO (solo los IDs ficticios)
 *            para poder re-ejecutar el seed sin duplicar.
 *
 * El token de base de datos se lee de las variables de entorno:
 *   SUPABASE_DB_TOKEN  (token sbp_... de acceso a la BD)
 *   SUPABASE_PROJECT_REF  (ref del proyecto, p.ej. svncfsnqpntlmwlvvlgd)
 *
 * Seguridad: solo opera sobre el id de un usuario que ya existe en auth.users.
 * No elimina ningún dato del usuario salvo los IDs ficticios de demostración
 * (0000...-0001 etc.) si se pasa --reset. No desactiva RLS ni toca FKs.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.SUPABASE_DB_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`;

const DEMO_IDS = [
  "00000000-0000-0000-0000-0000000000",
  "10000000-0000-0000-0000-000000000",
  "20000000-0000-0000-0000-000000000",
  "30000000-0000-0000-0000-000000000",
  "40000000-0000-0000-0000-000000000",
  "50000000-0000-0000-0000-000000000",
];

async function query(sql) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`SQL falló (${res.status}): ${text.slice(0, 800)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Envuelve un bloque SQL con el contexto JWT de UN usuario real (su sub) para que
// el trigger de auditoría (audit_trigger) registre al actor correcto. Sin esto,
// los INSERT/UPDATE/DELETE de las tablas financieras (y sus borrados en cascada)
// escribirían audit_logs con actor NULL y violarían audit_logs.user_id NOT NULL.
function wrapUser(sql, user) {
  return [
    "BEGIN;",
    `SET LOCAL request.jwt.claims = '{"sub":"${user.id}","role":"authenticated","email":"${user.email}"}';`,
    sql,
    "COMMIT;",
  ].join("\n");
}

async function main() {
  const email = process.argv[2];
  const reset = process.argv.includes("--reset");

  if (!email) {
    console.error("Uso: node scripts/seed-demo.mjs <email> [--reset]");
    process.exit(1);
  }
  if (!TOKEN || !REF) {
    console.error("Falta SUPABASE_DB_TOKEN o SUPABASE_PROJECT_REF en el entorno.");
    process.exit(1);
  }

  // 1) Buscar el usuario real por email
  const rows = await query(
    `SELECT id, email FROM auth.users WHERE email = '${email}' LIMIT 1;`
  );
  const user = Array.isArray(rows) ? rows[0] : undefined;
  if (!user) {
    console.error(`No se encontró ningún usuario con email '${email}' en auth.users.`);
    console.error("Primero regístrate (o crea el usuario) en la aplicación antes de cargar el seed.");
    process.exit(1);
  }
  console.log(`Usuario real encontrado: ${user.email} (${user.id})`);

  // 2) (Opcional) limpiar datos demo previos antes de re-seed
  if (reset) {
    const like = DEMO_IDS.map((p) => `id::text LIKE '${p}%'`).join(" OR ");
    await query(
      wrapUser(
        `DELETE FROM projects WHERE ${like} OR client_id::text LIKE '10000000%';
        DELETE FROM clients WHERE id::text LIKE '10000000%';
        DELETE FROM workers WHERE id::text LIKE '40000000%' OR id::text LIKE '50000000%';
        DELETE FROM suppliers WHERE id::text LIKE '50000000%';`,
        user
      )
    );
    console.log("Datos demo previos limpiados (--reset).");
  }

  // 3) Sustituir el placeholder por el id real
  const seedPath = resolve(__dirname, "../supabase/seed_demo.sql");
  let sql = readFileSync(seedPath, "utf8").replace(/^\uFEFF/, "");
  if (!sql.includes("__USER_ID__")) {
    console.error("seed_demo.sql no contiene el placeholder __USER_ID__.");
    process.exit(1);
  }
  sql = sql.split("__USER_ID__").join(user.id);

  // 4) Ejecutar el seed con el contexto JWT del usuario real (wrapUser) para que
  //    el trigger audit_trigger registre el actor correcto y no falle por NULL.
  await query(wrapUser(sql, user));
  console.log("Seed aplicado correctamente.");

  // 5) Verificación
  const counts = await query(
    `SELECT
      (SELECT count(*) FROM clients) clients,
      (SELECT count(*) FROM projects) projects,
      (SELECT count(*) FROM contracts) contracts,
      (SELECT count(*) FROM project_budgets) budgets,
      (SELECT count(*) FROM expenses) expenses,
      (SELECT count(*) FROM workers) workers,
      (SELECT count(*) FROM worker_payments) wp,
      (SELECT count(*) FROM income_payments) income,
      (SELECT count(*) FROM personal_withdrawals) withdrawals,
      (SELECT count(*) FROM suppliers) suppliers;`
  );
  console.log("Conteos de demostración:", JSON.stringify(counts[0]));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
