import { ouvrirDB, ajouterProjet, listerProjets, supprimerProjet,
         ajouterTache, listerTaches, modifierTache, supprimerTache } from "./db.js";

const $ = id => document.getElementById(id);
let db, projetCourant = null;

async function afficherProjets() {
  const projets = await listerProjets(db);
  const ul = $("projets");
  ul.innerHTML = "";
  projets.forEach(p => {
    const li = document.createElement("li");
    li.append(p.nom);
    li.dataset.testid = "projet";
    if (p.id === projetCourant) li.className = "actif";
    li.onclick = () => { projetCourant = p.id; afficherProjets(); afficherTaches(); };
    const del = document.createElement("button");
    del.textContent = "×";
    del.title = "Supprimer le projet";
    del.onclick = async e => {
      e.stopPropagation();
      await supprimerProjet(db, p.id);
      if (projetCourant === p.id) projetCourant = null;
      afficherProjets(); afficherTaches();
    };
    li.appendChild(del);
    ul.appendChild(li);
  });
}

async function afficherTaches() {
  const ul = $("taches");
  ul.innerHTML = "";
  $("zone-taches").hidden = projetCourant === null;
  if (projetCourant === null) return;
  const taches = await listerTaches(db, projetCourant);
  taches.forEach(t => {
    const li = document.createElement("li");
    li.dataset.testid = "tache";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.terminee;
    cb.onchange = async () => { await modifierTache(db, t.id, { terminee: cb.checked }); afficherTaches(); };
    const span = document.createElement("span");
    span.textContent = t.titre;
    if (t.terminee) span.className = "terminee";
    const edit = document.createElement("button");
    edit.textContent = "Modifier";
    edit.onclick = async () => {
      const titre = prompt("Nouveau titre :", t.titre);
      if (titre && titre.trim()) { await modifierTache(db, t.id, { titre }); afficherTaches(); }
    };
    const del = document.createElement("button");
    del.textContent = "Supprimer";
    del.onclick = async () => { await supprimerTache(db, t.id); afficherTaches(); };
    li.append(cb, span, edit, del);
    ul.appendChild(li);
  });
}

$("form-projet").onsubmit = async e => {
  e.preventDefault();
  const nom = $("nom-projet").value;
  if (!nom.trim()) return;
  projetCourant = await ajouterProjet(db, nom);
  $("nom-projet").value = "";
  afficherProjets(); afficherTaches();
};

$("form-tache").onsubmit = async e => {
  e.preventDefault();
  const titre = $("titre-tache").value;
  if (!titre.trim() || projetCourant === null) return;
  await ajouterTache(db, projetCourant, titre);
  $("titre-tache").value = "";
  afficherTaches();
};

db = await ouvrirDB();
afficherProjets();
afficherTaches();
