import { test, expect } from "@playwright/test";

test("projet + tâche : ajout, modification, persistance après rechargement", async ({ page }) => {
  await page.goto("/");
  await page.fill("#nom-projet", "Ecole");
  await page.click("#form-projet button");
  await expect(page.getByTestId("projet")).toHaveCount(1);

  await page.fill("#titre-tache", "Devoir JS");
  await page.click("#form-tache button");
  await expect(page.getByTestId("tache")).toContainText("Devoir JS");

  page.once("dialog", d => d.accept("Devoir JS terminé"));
  await page.getByRole("button", { name: "Modifier" }).click();
  await expect(page.getByTestId("tache")).toContainText("Devoir JS terminé");

  await page.reload(); // les données viennent d'IndexedDB
  await page.getByTestId("projet").click();
  await expect(page.getByTestId("tache")).toContainText("Devoir JS terminé");
});
