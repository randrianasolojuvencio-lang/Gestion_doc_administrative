// Photos d'identité : contrôle du fichier choisi et réduction avant l'envoi

const TYPES_ACCEPTES = ['image/jpeg', 'image/png'];
const TAILLE_MAX_CHOIX = 10 * 1024 * 1024; // 10 Mo : taille du fichier que l'agent peut choisir

// Contrôle le fichier choisi : renvoie un message d'erreur, ou '' si tout va bien
export function controlerPhoto(fichier) {
  if (!TYPES_ACCEPTES.includes(fichier.type)) return 'La photo doit être au format JPG ou PNG.';
  if (fichier.size > TAILLE_MAX_CHOIX) return 'La photo ne doit pas dépasser 10 Mo.';
  return '';
}

// Réduit la photo (800 pixels au plus) et l'enregistre en JPG :
// un fichier léger suffit pour reconnaître une personne
export async function reduirePhoto(fichier, cote = 800) {
  const image = await createImageBitmap(fichier);
  const echelle = Math.min(1, cote / Math.max(image.width, image.height));
  const largeur = Math.round(image.width * echelle);
  const hauteur = Math.round(image.height * echelle);

  const canevas = document.createElement('canvas');
  canevas.width = largeur;
  canevas.height = hauteur;

  const contexte = canevas.getContext('2d');
  contexte.fillStyle = '#ffffff'; // fond blanc pour les PNG transparents
  contexte.fillRect(0, 0, largeur, hauteur);
  contexte.drawImage(image, 0, 0, largeur, hauteur);
  image.close();

  const blob = await new Promise((resolve) => canevas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('La photo n\'a pas pu être préparée.');

  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}