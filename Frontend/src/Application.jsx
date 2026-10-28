import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { obtenirProfil, seDeconnecter } from './services/serviceApi';
import MiseEnPage from './composants/MiseEnPage';
import PageConnexion from './pages/PageConnexion';
import PageChangementMotDePasse from './pages/PageChangementMotDePasse';
import PageAccueil from './pages/PageAccueil';
import PageAgents from './pages/PageAgents';
import PageEtudiants from './pages/etudiants/PageEtudiants';
import PageFormulaireEtudiant from './pages/etudiants/PageFormulaireEtudiant';
import PageFicheEtudiant from './pages/etudiants/PageFicheEtudiant';
import PageDonneesDeBase from './pages/donneesDeBase/PageDonneesDeBase';
import PageDemandes from './pages/demandes/PageDemandes';
import PageNouvelleDemande from './pages/demandes/PageNouvelleDemande';
import PageFicheDemande from './pages/demandes/PageFicheDemande';
import PageComptabilite from './pages/comptabilite/PageComptabilite';

// Composant principal : choisit ce qu'on affiche selon l'état de l'agent
export default function Application() {
  const [agent, setAgent] = useState(null);  // agent connecté, ou null
  const [pret, setPret] = useState(false);   // vrai quand la session a été vérifiée

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
  }

  if (!pret) return <p className="chargement">Chargement…</p>;

  // Pas connecté : page de connexion
  if (!agent) return <PageConnexion surConnexion={setAgent} />;

  // Mot de passe provisoire : l'agent doit d'abord en choisir un nouveau
  if (agent.doit_changer_mot_de_passe) {
    return <PageChangementMotDePasse agent={agent} surChangement={setAgent} />;
  }

  // Connecté : menu à gauche, et une page par adresse
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MiseEnPage agent={agent} surDeconnexion={deconnecter} />}>
          <Route path="/" element={<PageAccueil agent={agent} />} />

          {/* Demandes de documents */}
          <Route path="/demandes" element={<PageDemandes />} />
          <Route path="/demandes/nouvelle" element={<PageNouvelleDemande />} />
          <Route path="/demandes/:reference" element={<PageFicheDemande />} />

          {/* Étudiants : la même page sert à créer et à modifier */}
          <Route path="/etudiants" element={<PageEtudiants />} />
          <Route path="/etudiants/nouveau" element={<PageFormulaireEtudiant key="creation" />} />
          <Route path="/etudiants/:numMatricule/modifier" element={<PageFormulaireEtudiant key="modification" />} />
          <Route path="/etudiants/:numMatricule" element={<PageFicheEtudiant />} />

          <Route path="/comptabilite" element={<PageComptabilite />} />
          <Route path="/donnees-de-base/:rubrique?" element={<PageDonneesDeBase />} />
          <Route path="/agents" element={<PageAgents agentConnecte={agent} />} />
        </Route>
        {/* Toute autre adresse ramène au tableau de bord */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}