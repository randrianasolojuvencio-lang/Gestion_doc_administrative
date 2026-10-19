import { useState } from 'react';
import { changerMotDePasse } from '../services/serviceApi';

// Page affichée à la première connexion : l'agent remplace son mot de passe provisoire
export default function PageChangementMotDePasse({ agent, surChangement }) {
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur('');

    if (nouveau !== confirmation) {
      setErreur('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    try {
      await changerMotDePasse(actuel, nouveau);
      // On met à jour l'agent pour passer à la page d'accueil
      surChangement({ ...agent, doit_changer_mot_de_passe: false });
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <form className="carte" onSubmit={soumettre}>
      <h2>Choisissez votre mot de passe</h2>
      <p>Votre mot de passe provisoire doit être remplacé avant de continuer.</p>
      <label>Mot de passe actuel</label>
      <input type="password" value={actuel} onChange={(e) => setActuel(e.target.value)} required />
      <label>Nouveau mot de passe (8 caractères minimum)</label>
      <input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required />
      <label>Confirmer le nouveau mot de passe</label>
      <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
      <button>Enregistrer</button>
      {erreur && <p className="erreur">{erreur}</p>}
    </form>
  );
}