// Couche d'accès à IndexedDB : projets et tâches.
const DB_VERSION = 1;

export function ouvrirDB(nom = "todo-db") {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(nom, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore("projets", { keyPath: "id", autoIncrement: true });
      const taches = db.createObjectStore("taches", { keyPath: "id", autoIncrement: true });
      taches.createIndex("projetId", "projetId", { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Exécute une opération sur un ou plusieurs stores et attend la fin de la transaction.
function tx(db, stores, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let resultat;
    Promise.resolve(fn(t)).then(r => { resultat = r; }, err => { reject(err); try { t.abort(); } catch {} });
    t.oncomplete = () => resolve(resultat);
    t.onerror = () => reject(t.error);
  });
}

const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

// ---- Projets ----
export function ajouterProjet(db, nom) {
  if (!nom || !nom.trim()) return Promise.reject(new Error("Nom de projet vide"));
  return tx(db, "projets", "readwrite", t => req(t.objectStore("projets").add({ nom: nom.trim() })));
}

export function listerProjets(db) {
  return tx(db, "projets", "readonly", t => req(t.objectStore("projets").getAll()));
}

export function supprimerProjet(db, id) {
  // Supprime aussi les tâches du projet.
  return tx(db, ["projets", "taches"], "readwrite", async t => {
    const store = t.objectStore("taches");
    const cles = await req(store.index("projetId").getAllKeys(id));
    cles.forEach(c => store.delete(c));
    t.objectStore("projets").delete(id);
  });
}

// ---- Tâches ----
export async function ajouterTache(db, projetId, titre) {
  if (!titre || !titre.trim()) throw new Error("Titre de tâche vide");
  const projet = await tx(db, "projets", "readonly", t => req(t.objectStore("projets").get(projetId)));
  if (!projet) throw new Error("Projet inexistant");
  return tx(db, "taches", "readwrite", t =>
    req(t.objectStore("taches").add({ projetId, titre: titre.trim(), terminee: false })));
}

export function listerTaches(db, projetId) {
  return tx(db, "taches", "readonly", t => req(t.objectStore("taches").index("projetId").getAll(projetId)));
}

export function modifierTache(db, id, changements) {
  if (changements.titre !== undefined && !changements.titre.trim())
    return Promise.reject(new Error("Titre de tâche vide"));
  return tx(db, "taches", "readwrite", async t => {
    const store = t.objectStore("taches");
    const tache = await req(store.get(id));
    if (!tache) throw new Error("Tâche inexistante");
    const maj = { ...tache, ...changements, id };
    if (maj.titre) maj.titre = maj.titre.trim();
    await req(store.put(maj));
    return maj;
  });
}

export function supprimerTache(db, id) {
  return tx(db, "taches", "readwrite", t => { t.objectStore("taches").delete(id); });
}
