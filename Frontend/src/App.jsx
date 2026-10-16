import { useEffect, useState } from 'react';
import { connexion, moi, deconnexion, changerMotDePasse } from './api';

function Connexion({ onConnecte }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      onConnecte(await connexion(email, motDePasse));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form className="carte" onSubmit={soumettre}>
      <h2>Connexion</h2>
      <label>E-mail</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label>Mot de passe</label>
      <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
      <button disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
      {erreur && <p className="erreur">{erreur}</p>}
    </form>
  );
}

function ChangerMotDePasse({ agent, onFait }) {
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    if (nouveau !== confirmation) {
      setErreur('Les deux mots de passe ne sont pas identiques.');
      return;
    }
    try {
      await changerMotDePasse(actuel, nouveau);
      onFait({ ...agent, doit_changer_mot_de_passe: false });
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
      <label>Confirmer</label>
      <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
      <button>Enregistrer</button>
      {erreur && <p className="erreur">{erreur}</p>}
    </form>
  );
}

export default function App() {
  const [agent, setAgent] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    moi()
      .then(setAgent)
      .catch(() => setAgent(null))
      .finally(() => setPret(true));
  }, []);

  if (!pret) return <p className="carte">Chargement…</p>;
  if (!agent) return <Connexion onConnecte={setAgent} />;
  if (agent.doit_changer_mot_de_passe) {
    return <ChangerMotDePasse agent={agent} onFait={setAgent} />;
  }

  return (
    <div className="carte">
      <h2>Bonjour {agent.prenom_personnel} {agent.nom_personnel}</h2>
      <p>Vous êtes connecté avec {agent.email_personnel}.</p>
      <button onClick={async () => { await deconnexion(); setAgent(null); }}>
        Se déconnecter
      </button>
    </div>
  );
}