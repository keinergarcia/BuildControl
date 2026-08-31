import { test, expect } from "./fixtures";

// E2E críticos que exige el maestro (#42):
//  - login
//  - crear proyecto
//  - registrar gasto
//  - consultar rentabilidad
//
// Requieren un backend Supabase local en ejecución y las credenciales demo
// definidas como E2E_EMAIL / E2E_PASSWORD. Sin ellas, la suite se omite.

test("Iniciar sesión y ver el dashboard", async ({ authedPage }) => {
  await expect(authedPage.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  await expect(authedPage.getByText(/Resumen general/i).first()).toBeVisible();
});

test("Crear un proyecto", async ({ authedPage }) => {
  await authedPage.goto("/projects");
  await authedPage.getByRole("heading", { name: /Proyectos/i }).waitFor({ timeout: 15000 });

  await authedPage.getByRole("button", { name: /Nuevo proyecto/i }).first().click();

  const form = authedPage.getByRole("dialog");
  await form.getByLabel("Nombre del proyecto *").fill(`Obra E2E ${Date.now()}`);

  // Guardar proyecto
  await form.getByRole("button", { name: /Guardar|Crear/i }).first().click();

  // El toast de confirmación debe aparecer
  await expect(authedPage.getByText(/proyecto creado|creado|creado correctamente/i).first()).toBeVisible({
    timeout: 15000,
  });
});

test("Registrar un gasto", async ({ authedPage }) => {
  await authedPage.goto("/expenses");
  await authedPage.getByRole("heading", { name: /Gastos/i }).waitFor({ timeout: 15000 });

  await authedPage.getByRole("button", { name: /Nuevo gasto/i }).first().click();

  const form = authedPage.getByRole("dialog");
  // Seleccionar proyecto (primera opción)
  await form.getByText(/Seleccione el proyecto|Seleccionar proyecto/i).first().click();
  const listbox = authedPage.getByRole("listbox");
  await listbox.locator("[data-radix-collection-item]").first().click();

  await form.getByLabel("Descripción *").fill("Material E2E");
  await form.getByLabel("Valor *").fill("250000");

  await form.getByRole("button", { name: /Guardar/i }).click();
  await expect(authedPage.getByText(/gasto registrado/i).first()).toBeVisible({ timeout: 15000 });
});

test("Consultar la rentabilidad en el dashboard", async ({ authedPage }) => {
  // Los datos demo (seed) traen contratos; la sección de rentabilidad debe renderizar
  await authedPage.goto("/");
  await expect(authedPage.getByText(/rentabilidad/i).first()).toBeVisible({ timeout: 15000 });
  // Al menos una métrica numérica de utilidad debería presentarse
  await expect(authedPage.getByText(/utilidad/i).first()).toBeVisible();
});
