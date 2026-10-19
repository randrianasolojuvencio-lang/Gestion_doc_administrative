import { useEffect, useState } from 'react';
import { obtenirProfil, seDeconnecter } from './services/serviceApi';
import PageConnexion from './pages/PageConnexion';
import PageChangementMotDePasse from './pages/PageChangementMotDePasse';
import PageAccueil from './pages/PageAccueil';
import PageAgents from './pages/PageAgents';

// Composant principal : choisit la page à afficher selon l'état de l'agent
export default function Application() {
  const [agent, setAgent] = useState(null);   // agent connecté, ou null
  const [pret, setPret] = useState(false);    // vrai quand la session a été vérifiée
  const [page, setPage] = useState('accueil');

  // Au chargement, on regarde si une session est déjà ouverte
  useEffect(() => {
    obtenirProfil()
      .then(setAgent)
      .catch(() => setAgent(null))
      .finally(() => setPret(true));
  }, []);

  async function deconnecter() {
    await seDeconnecter();
    setAgent(null);
    setPage('accueil');
  }

  if (!pret) return <p className="carte">Chargement…</p>;
  if (!agent) return <PageConnexion surConnexion={setAgent} />;

  if (agent.doit_changer_mot_de_passe) {
    return <PageChangementMotDePasse agent={agent} surChangement={setAgent} />;
  }

  if (page === 'agents') {
    return <PageAgents agentConnecte={agent} retour={() => setPage('accueil')} />;
  }

  return (
    <PageAccueil
      agent={agent}
      ouvrirAgents={() => setPage('agents')}
      surDeconnexion={deconnecter}
    />
  );
}