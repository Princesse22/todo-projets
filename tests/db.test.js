import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { ouvrirDB, ajouterProjet, listerProjets, supprimerProjet,
         ajouterTache, listerTaches, modifierTache, supprimerTache } from "../src/db.js";

let db, n = 0;
beforeEach(async () => { db = await ouvrirDB("test-" + n++); });

describe("Projets", () => {
  it("ajoute et liste des projets", async () => {
    await ajouterProjet(db, "Ecole");
    await ajouterProjet(db, "Maison");
    const projets = await listerProjets(db);
    expect(projets.map(p => p.nom)).toEqual(["Ecole", "Maison"]);
  });
  it("refuse un nom vide", async () => {
    await expect(ajouterProjet(db, "   ")).rejects.toThrow();
  });
  it("supprime un projet et ses tâches", async () => {
    const p = await ajouterProjet(db, "Ecole");
    await ajouterTache(db, p, "Devoir");
    await supprimerProjet(db, p);
    expect(await listerProjets(db)).toHaveLength(0);
    expect(await listerTaches(db, p)).toHaveLength(0);
  });
});

describe("Tâches", () => {
  it("ajoute une tâche à un projet", async () => {
    const p = await ajouterProjet(db, "Ecole");
    await ajouterTache(db, p, "Devoir JS");
    const taches = await listerTaches(db, p);
    expect(taches).toHaveLength(1);
    expect(taches[0]).toMatchObject({ titre: "Devoir JS", terminee: false, projetId: p });
  });
  it("refuse un titre vide ou un projet inexistant", async () => {
    const p = await ajouterProjet(db, "Ecole");
    await expect(ajouterTache(db, p, "")).rejects.toThrow();
    await expect(ajouterTache(db, 999, "X")).rejects.toThrow();
  });
  it("modifie le titre et l'état", async () => {
    const p = await ajouterProjet(db, "Ecole");
    const id = await ajouterTache(db, p, "Ancien");
    await modifierTache(db, id, { titre: "Nouveau" });
    await modifierTache(db, id, { terminee: true });
    const [t] = await listerTaches(db, p);
    expect(t).toMatchObject({ titre: "Nouveau", terminee: true });
  });
  it("refuse de modifier une tâche inexistante ou avec un titre vide", async () => {
    const p = await ajouterProjet(db, "Ecole");
    const id = await ajouterTache(db, p, "A");
    await expect(modifierTache(db, 999, { titre: "B" })).rejects.toThrow();
    await expect(modifierTache(db, id, { titre: " " })).rejects.toThrow();
  });
  it("supprime une tâche", async () => {
    const p = await ajouterProjet(db, "Ecole");
    const id = await ajouterTache(db, p, "A");
    await supprimerTache(db, id);
    expect(await listerTaches(db, p)).toHaveLength(0);
  });
  it("isole les tâches par projet", async () => {
    const a = await ajouterProjet(db, "A");
    const b = await ajouterProjet(db, "B");
    await ajouterTache(db, a, "t1");
    await ajouterTache(db, b, "t2");
    expect((await listerTaches(db, a)).map(t => t.titre)).toEqual(["t1"]);
  });
});
