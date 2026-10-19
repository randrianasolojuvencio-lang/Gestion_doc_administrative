// Adresse du backend Laravel
const ADRESSE_API = 'http://localhost:8000';

// Lit le jeton de sécurité (XSRF) que Laravel place dans un cookie
function lireJetonXsrf() {
  const resultat = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return resultat ? decodeURIComponent(resultat[1]) : '';
}

// Envoie une requête au backend et renvoie la réponse en JSON.
// En cas d'erreur, lance une erreur avec le message du serveur.
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
    // Laravel renvoie les erreurs de validation dans "errors"
    const premiereErreur = donnees.errors ? Object.values(donnees.errors)[0][0] : null;
    throw new Error(premiereErreur || donnees.message || 'Erreur ' + reponse.status);
  }
  return donnees;
}

// Connexion : on demande d'abord le cookie de sécurité, puis on envoie l'e-mail et le mot de passe
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

// Gestion des agents
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