import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { urlPhotoEtudiant } from '../services/serviceApi';
import './PhotoEtudiant.css';

// Photo d'identité d'un étudiant, ou une silhouette s'il n'en a pas.
// taille : 'petite', 'moyenne' ou 'grande'.
// Astuce : donnez une "key" qui change avec la version pour recharger l'image après un remplacement.
export default function PhotoEtudiant({ numMatricule, aPhoto, version = 0, taille = 'moyenne', nom = '' }) {
  const [echec, setEchec] = useState(false);

  if (!aPhoto || echec) {
    return (
      <span className={`photo-etudiant photo-${taille} photo-vide`} role="img" aria-label="Pas de photo">
        <UserRound size={taille === 'grande' ? 56 : 28} aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      className={`photo-etudiant photo-${taille}`}
      src={urlPhotoEtudiant(numMatricule, version)}
      alt={nom ? `Photo de ${nom}` : 'Photo d\'identité'}
      onError={() => setEchec(true)}
    />
  );
}