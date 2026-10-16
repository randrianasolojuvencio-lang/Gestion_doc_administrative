const API = 'http://localhost:8000';

function xsrf() {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

export async function api(chemin, { headers, ...options } = {}) {
  const reponse = await fetch(API + chemin, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrf(),
      ...headers,
    },
    ...options,
  });
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(donnees.message || 'Erreur ' + reponse.status);
  return donnees;
}

export async function connexion(emailPersonnel, motDePasse) {
  await fetch(API + '/sanctum/csrf-cookie', { credentials: 'include' });
  return api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email_personnel: emailPersonnel, mot_de_passe: motDePasse }),
  });
}

export const moi = () => api('/api/moi');
export const deconnexion = () => api('/api/logout', { method: 'POST' });
export const changerMotDePasse = (actuel, nouveau) =>
  api('/api/mot-de-passe', {
    method: 'POST',
    body: JSON.stringify({ mot_de_passe_actuel: actuel, nouveau_mot_de_passe: nouveau }),
  });