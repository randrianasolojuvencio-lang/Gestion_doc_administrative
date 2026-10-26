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
  const reponse = await fetch(ADRESSE_API + chemin, {
    credentials: 'include', // envoie le cookie de session
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
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

// Connexion 
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

// Agents 
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

// Listes de choix des formulaires : années, niveaux, parcours, groupes, statuts
export const listerReferences = () => appelerApi('/api/references');

// Données de base : administration, mentions, parcours, niveaux, groupes, années, statuts 
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