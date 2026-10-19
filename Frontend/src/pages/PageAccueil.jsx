// Page d'accueil de l'agent connecté
export default function PageAccueil({ agent, ouvrirAgents, surDeconnexion }) {
  return (
    <div className="carte">
      <h2>Bonjour {agent.prenom_personnel} {agent.nom_personnel}</h2>
      <p>Vous êtes connecté avec {agent.email_personnel}.</p>
      <button onClick={ouvrirAgents}>Gérer les agents</button>
      <button className="secondaire" onClick={surDeconnexion}>Se déconnecter</button>
    </div>
  );
}