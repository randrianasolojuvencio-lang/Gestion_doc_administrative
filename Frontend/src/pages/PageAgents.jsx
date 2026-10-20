import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleCheck, CircleAlert, UserPlus, KeyRound, UserX, UserCheck, ArrowLeft,
} from 'lucide-react';
import {
  listerAgents, creerAgent, reinitialiserMotDePasse, changerEtatAgent,
} from '../services/serviceApi';
import './PageAgents.css';

const FORMULAIRE_VIDE = {
  cin_personnel: '', nom_personnel: '', prenom_personnel: '',
  telephone_personnel: '', email_personnel: '',
};

// Liste des agents, ajout d'un agent, réinitialisation de mot de passe, activation
export default function PageAgents({ agentConnecte }) {
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
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <Link to="/" className="lien-retour">
            <ArrowLeft size={16} aria-hidden="true" /> Retour au tableau de bord
          </Link>
          <h1>Agents de la scolarité</h1>
          <p className="sous-titre">
            Ajoutez un agent, réinitialisez un mot de passe ou désactivez un compte.
          </p>
        </div>
      </header>

      {/* Message de succès : le mot de passe provisoire, affiché une seule fois */}
      {motDePasseAffiche && (
        <div className="message-succes" role="status">
          <CircleCheck size={20} aria-hidden="true" />
          <div>
            <p className="sans-marge">
              Mot de passe provisoire de <strong>{motDePasseAffiche.email}</strong> :
            </p>
            <p className="mot-de-passe">{motDePasseAffiche.motDePasse}</p>
            <p className="sans-marge">À donner à l'agent. Il ne sera plus affiché.</p>
          </div>
        </div>
      )}

      {erreur && (
        <div className="message-erreur" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          <span>{erreur}</span>
        </div>
      )}

      <section className="panneau">
        <h2>Ajouter un agent</h2>
        <form onSubmit={ajouterAgent} className="formulaire-agent">
          <input name="cin_personnel" placeholder="CIN (12 chiffres)" maxLength={12} value={formulaire.cin_personnel} onChange={modifierChamp} required />
          <input name="nom_personnel" placeholder="Nom" value={formulaire.nom_personnel} onChange={modifierChamp} required />
          <input name="prenom_personnel" placeholder="Prénom" value={formulaire.prenom_personnel} onChange={modifierChamp} />
          <input name="telephone_personnel" placeholder="Téléphone" maxLength={15} value={formulaire.telephone_personnel} onChange={modifierChamp} />
          <input name="email_personnel" type="email" placeholder="E-mail" value={formulaire.email_personnel} onChange={modifierChamp} required />
          <button className="bouton">
            <UserPlus size={18} aria-hidden="true" /> Enregistrer
          </button>
        </form>
      </section>

      <section className="panneau">
        <h2>Liste des agents</h2>
        <table className="tableau">
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
                  <td>
                    <span className={agent.actif ? 'etat etat-actif' : 'etat etat-inactif'}>
                      {agent.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="bouton bouton-secondaire bouton-petit" disabled={estMoi} onClick={() => reinitialiser(agent)}>
                      <KeyRound size={15} aria-hidden="true" /> Réinitialiser
                    </button>
                    <button className="bouton bouton-secondaire bouton-petit" disabled={estMoi} onClick={() => basculerEtat(agent)}>
                      {agent.actif
                        ? <><UserX size={15} aria-hidden="true" /> Désactiver</>
                        : <><UserCheck size={15} aria-hidden="true" /> Activer</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}