// Fonctions de mise en forme communes à plusieurs pages

// Date du jour au format AAAA-MM-JJ (heure locale)
export const aujourdhui = () => new Date().toLocaleDateString('en-CA');

// Premier jour du mois en cours, au format AAAA-MM-JJ
export function debutDuMois() {
  const maintenant = new Date();
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toLocaleDateString('en-CA');
}

// 2026-10-23 devient 23/10/2026
export function formaterDate(valeur) {
  return valeur ? String(valeur).slice(0, 10).split('-').reverse().join('/') : '—';
}

// 2026-10-23 10:12:00 devient 23/10/2026 10:12
export function formaterDateHeure(valeur) {
  if (!valeur) return '—';
  const [date, heure = ''] = String(valeur).split(/[ T]/);
  return `${formaterDate(date)} ${heure.slice(0, 5)}`.trim();
}

// 5000 devient 5 000 Ar
export function formaterMontant(valeur) {
  return valeur === null || valeur === undefined ? '—' : `${Number(valeur).toLocaleString('fr-FR')} Ar`;
}

// Services qui peuvent fabriquer un document
export const LIBELLES_FABRICANT = {
  SCOLARITE: 'La scolarité',
  BUREAU_003: 'Le bureau 003',
  SERVICE_DIPLOME: 'Le service diplôme',
};