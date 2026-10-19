import { useEffect, useState } from 'react';
import {
  listerAgents, creerAgent, reinitialiserMotDePasse, changerEtatAgent,
} from '../services/serviceApi';

const FORMULAIRE_VIDE = {
  cin_personnel: '', nom_personnel: '', prenom_personnel: '',
  telephone_personnel: '', email_personnel: '',
};

// Liste des agents, ajout d'un agent, réinitialisation de mot de passe, activation
export default function PageAgents({ agentConnecte, retour }) {
  const [agents, setAgents] = useState([]);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [erreur, setErreur] = useState('');
  // Mot de passe provisoire à communiquer à l'agent (affiché une seule fois)
  const [motDePasseAffiche, setMotDePasseAffiche] = useState(null);

  async function chargerAgents() {
    try {
      setAgents(await listerAgents());
    } catch (err) {
      setErreur(err.message);
    }
  }

  useEffect(() => {
   let annule = false; // évite de modifier l'état si la page a été quittée entre-temps

    listerAgents()
      .then((liste) => {
        if (!annule) setAgents(liste);
      })
      .catch((err) => {
        if (!annule) setErreur(err.message);
      });

    return () => {
      annule = true;
    };
  }, []);

  function modifierChamp(evenement) {
    setFormulaire({ ...formulaire, [evenement.target.name]: evenement.target.value });
  }

  async function ajouterAgent(evenement) {
    evenement.preventDefault();
    setErreur('');
    setMotDePasseAffiche(null);
    try {
      const reponse = await creerAgent(formulaire);
      setMotDePasseAffiche({
        email: reponse.agent.email_personnel,
        motDePasse: reponse.mot_de_passe_provisoire,
      });
      setFormulaire(FORMULAIRE_VIDE);
      await chargerAgents();
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function reinitialiser(agent) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${agent.nom_personnel} ?`)) return;
    setErreur('');
    try {
      const reponse = await reinitialiserMotDePasse(agent.cin_personnel);
      setMotDePasseAffiche({
        email: agent.email_personnel,
        motDePasse: reponse.mot_de_passe_provisoire,
      });
      await chargerAgents();
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function basculerEtat(agent) {
    setErreur('');
    try {
      await changerEtatAgent(agent.cin_personnel, !agent.actif);
      await chargerAgents();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div className="carte large">
      <h2>Agents de la scolarité</h2>
      <button className="secondaire" onClick={retour}>← Retour</button>

      {motDePasseAffiche && (
        <div className="alerte">
          <p>Mot de passe provisoire de <strong>{motDePasseAffiche.email}</strong> :</p>
          <p className="mot-de-passe">{motDePasseAffiche.motDePasse}</p>
          <p>À donner à l'agent. Il ne sera plus affiché.</p>
        </div>
      )}

      <h3>Ajouter un agent</h3>
      <form onSubmit={ajouterAgent} className="formulaire-agent">
        <input name="cin_personnel" placeholder="CIN (12 chiffres)" maxLength={12} value={formulaire.cin_personnel} onChange={modifierChamp} required />
        <input name="nom_personnel" placeholder="Nom" value={formulaire.nom_personnel} onChange={modifierChamp} required />
        <input name="prenom_personnel" placeholder="Prénom" value={formulaire.prenom_personnel} onChange={modifierChamp} />
        <input name="telephone_personnel" placeholder="Téléphone" maxLength={15} value={formulaire.telephone_personnel} onChange={modifierChamp} />
        <input name="email_personnel" type="email" placeholder="E-mail" value={formulaire.email_personnel} onChange={modifierChamp} required />
        <button>Enregistrer l'agent</button>
      </form>
      {erreur && <p className="erreur">{erreur}</p>}

      <table>
        <thead>
          <tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>État</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {agents.map((agent) => {
            const estMoi = agent.cin_personnel === agentConnecte.cin_personnel;
            return (
              <tr key={agent.cin_personnel}>
                <td>{agent.prenom_personnel} {agent.nom_personnel}</td>
                <td>{agent.email_personnel}</td>
                <td>{agent.telephone_personnel}</td>
                <td>{agent.actif ? 'Actif' : 'Désactivé'}</td>
                <td>
                  <button className="petit" disabled={estMoi} onClick={() => reinitialiser(agent)}>Réinitialiser</button>
                  <button className="petit" disabled={estMoi} onClick={() => basculerEtat(agent)}>
                    {agent.actif ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}