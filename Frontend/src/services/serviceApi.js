// Adresse du backend Laravel
const ADRESSE_API = 'http://localhost:8000';

// Lit le jeton de sécurité (XSRF) que Laravel place dans un cookie
function lireJetonXsrf() {
  const resultat = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return resultat ? decodeURIComponent(resultat[1]) : '';
}

// Envoie une requête au backend et renvoie la réponse en JSON.
// En cas d'erreur, lance une erreur avec le message du serveur et,
// pour les erreurs de validation, la liste des erreurs par champ.
export async function appelerApi(chemin, { headers, ...options } = {}) {
  const envoiFichier = options.body instanceof FormData;

  const reponse = await fetch(ADRESSE_API + chemin, {
    credentials: 'include', // envoie le cookie de session
    headers: {
      Accept: 'application/json',
      // Un envoi de fichier fixe lui-même son type ; sinon on envoie du JSON
      ...(envoiFichier ? {} : { 'Content-Type': 'application/json' }),
      'X-XSRF-TOKEN': lireJetonXsrf(),
      ...headers,
    },
    ...options,
  });

  const donnees = await reponse.json().catch(() => ({}));

  if (!reponse.ok) {
    const premiereErreur = donnees.errors ? Object.values(donnees.errors)[0][0] : null;
    const erreur = new Error(premiereErreur || donnees.message || 'Erreur ' + reponse.status);
    erreur.erreurs = donnees.errors ?? null; // erreurs par champ (validation Laravel)
    throw erreur;
  }
  return donnees;
}

// ===== Connexion =====
// On demande d'abord le cookie de sécurité, puis on envoie l'e-mail et le mot de passe
export async function seConnecter(emailPersonnel, motDePasse) {
  await fetch(ADRESSE_API + '/sanctum/csrf-cookie', { credentials: 'include' });
  return appelerApi('/api/connexion', {
    method: 'POST',
    body: JSON.stringify({ email_personnel: emailPersonnel, mot_de_passe: motDePasse }),
  });
}

export const obtenirProfil = () => appelerApi('/api/profil');
export const seDeconnecter = () => appelerApi('/api/deconnexion', { method: 'POST' });

export const changerMotDePasse = (motDePasseActuel, nouveauMotDePasse) =>
  appelerApi('/api/mot-de-passe', {
    method: 'POST',
    body: JSON.stringify({
      mot_de_passe_actuel: motDePasseActuel,
      nouveau_mot_de_passe: nouveauMotDePasse,
    }),
  });

// ===== Agents =====
export const listerAgents = () => appelerApi('/api/agents');

export const creerAgent = (donnees) =>
  appelerApi('/api/agents', { method: 'POST', body: JSON.stringify(donnees) });

export const reinitialiserMotDePasse = (cin) =>
  appelerApi(`/api/agents/${encodeURIComponent(cin)}/reinitialiser`, { method: 'POST' });

export const changerEtatAgent = (cin, actif) =>
  appelerApi(`/api/agents/${encodeURIComponent(cin)}/etat`, {
    method: 'POST',
    body: JSON.stringify({ actif }),
  });

// ===== Étudiants et inscriptions =====
export const listerEtudiants = (recherche = '', page = 1, filtres = {}) => {
  const parametres = new URLSearchParams({ recherche, page });
  // On n'envoie que les filtres choisis
  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur) parametres.set(cle, valeur);
  }
  return appelerApi(`/api/etudiants?${parametres}`);
};

export const obtenirEtudiant = (numMatricule) =>
  appelerApi(`/api/etudiants/${encodeURIComponent(numMatricule)}`);

export const creerEtudiant = (donnees) =>
  appelerApi('/api/etudiants', { method: 'POST', body: JSON.stringify(donnees) });

export const modifierEtudiant = (numMatricule, donnees) =>
  appelerApi(`/api/etudiants/${encodeURIComponent(numMatricule)}`, {
    method: 'PUT',
    body: JSON.stringify(donnees),
  });

export const supprimerEtudiant = (numMatricule) =>
  appelerApi(`/api/etudiants/${encodeURIComponent(numMatricule)}`, { method: 'DELETE' });

export const creerInscription = (numMatricule, donnees) =>
  appelerApi(`/api/etudiants/${encodeURIComponent(numMatricule)}/inscriptions`, {
    method: 'POST',
    body: JSON.stringify(donnees),
  });

// Complète ou corrige le numéro de bordereau d'une inscription
export const modifierBordereauInscription = (numMatricule, codeInscription, numeroBordereau) =>
  appelerApi(
    `/api/etudiants/${encodeURIComponent(numMatricule)}/inscriptions/${encodeURIComponent(codeInscription)}/bordereau`,
    { method: 'PUT', body: JSON.stringify({ numero_bordereau: numeroBordereau }) }
  );

// ===== Photo d'identité =====
// Adresse de l'image (la version change quand la photo est remplacée, pour forcer le rechargement)
export const urlPhotoEtudiant = (numMatricule, version = 0) =>
  `${ADRESSE_API}/api/etudiants/${encodeURIComponent(numMatricule)}/photo?v=${version}`;

export function envoyerPhotoEtudiant(numMatricule, fichier) {
  const donnees = new FormData();
  donnees.append('photo', fichier);
  return appelerApi(`/api/etudiants/${encodeURIComponent(numMatricule)}/photo`, {
    method: 'POST',
    body: donnees,
  });
}

export const supprimerPhotoEtudiant = (numMatricule) =>
  appelerApi(`/api/etudiants/${encodeURIComponent(numMatricule)}/photo`, { method: 'DELETE' });

// Listes de choix des formulaires : années, niveaux, parcours, groupes, statuts, types de documents
export const listerReferences = () => appelerApi('/api/references');

// ===== Données de base =====
export const listerDonneesBase = (rubrique) => appelerApi(`/api/donnees-base/${rubrique}`);

export const creerDonneeBase = (rubrique, donnees) =>
  appelerApi(`/api/donnees-base/${rubrique}`, { method: 'POST', body: JSON.stringify(donnees) });

export const modifierDonneeBase = (rubrique, code, donnees) =>
  appelerApi(`/api/donnees-base/${rubrique}/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(donnees),
  });

export const supprimerDonneeBase = (rubrique, code) =>
  appelerApi(`/api/donnees-base/${rubrique}/${encodeURIComponent(code)}`, { method: 'DELETE' });

// ===== Demandes de documents =====
export const listerDemandes = (recherche = '', page = 1, filtres = {}) => {
  const parametres = new URLSearchParams({ recherche, page });
  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur) parametres.set(cle, valeur);
  }
  return appelerApi(`/api/demandes?${parametres}`);
};

export const obtenirDemande = (reference) =>
  appelerApi(`/api/demandes/${encodeURIComponent(reference)}`);

export const creerDemande = (donnees) =>
  appelerApi('/api/demandes', { method: 'POST', body: JSON.stringify(donnees) });

// Fait passer la demande à l'étape suivante (la signature et la remise demandent des données)
export const avancerDemande = (reference, donnees = {}) =>
  appelerApi(`/api/demandes/${encodeURIComponent(reference)}/avancer`, {
    method: 'POST',
    body: JSON.stringify(donnees),
  });

// ===== Comptabilité =====
// Filtres de période et de type, transformés en paramètres d'adresse
function parametresComptabilite(filtres, page) {
  const parametres = new URLSearchParams();
  if (page) parametres.set('page', page);
  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur) parametres.set(cle, valeur);
  }
  return parametres;
}

export const obtenirEtatComptable = (filtres, page = 1) =>
  appelerApi(`/api/comptabilite?${parametresComptabilite(filtres, page)}`);

// Télécharge le fichier CSV des recettes de la période
export async function telechargerEtatComptable(filtres) {
  const reponse = await fetch(`${ADRESSE_API}/api/comptabilite/export?${parametresComptabilite(filtres)}`, {
    credentials: 'include',
    headers: { Accept: 'application/json, text/csv;q=0.9' },
  });

  if (!reponse.ok) {
    const donnees = await reponse.json().catch(() => ({}));
    throw new Error(donnees.message || 'Erreur ' + reponse.status);
  }

  // On crée un lien temporaire pour enregistrer le fichier reçu
  const fichier = await reponse.blob();
  const adresse = URL.createObjectURL(fichier);
  const lien = document.createElement('a');
  lien.href = adresse;
  lien.download = `recettes-${new Date().toLocaleDateString('en-CA')}.csv`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(adresse);
}