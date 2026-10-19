import { Link } from 'react-router-dom';
import { Plus, Clock, Hourglass, PenLine, CircleCheck, Inbox } from 'lucide-react';
import EtatVide from '../composants/EtatVide';
import './PageAccueil.css';

// Les chiffres seront branchés sur les demandes quand leur liste sera réalisée
const CHIFFRES = [
  { libelle: 'En attente', Icone: Clock },
  { libelle: 'En cours', Icone: Hourglass },
  { libelle: 'À signer', Icone: PenLine },
  { libelle: 'Délivrées', Icone: CircleCheck },
];

// Tableau de bord : vue d'ensemble des demandes de documents
export default function PageAccueil({ agent }) {
  const dateDuJour = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <h1>Bonjour {agent.prenom_personnel}</h1>
          <p className="sous-titre">{dateDuJour}</p>
        </div>
        <Link to="/demandes" className="bouton">
          <Plus size={18} aria-hidden="true" /> Nouvelle demande
        </Link>
      </header>

      <section className="cartes-chiffres">
        {CHIFFRES.map(({ libelle, Icone }) => (
          <div className="carte-chiffre" key={libelle}>
            <span className="carte-chiffre-icone"><Icone size={20} aria-hidden="true" /></span>
            <div>
              <strong>—</strong>
              <span>{libelle}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="panneau">
        <h2>Dernières demandes</h2>
        <EtatVide
          Icone={Inbox}
          titre="Aucune demande pour le moment"
          texte="Les demandes enregistrées par la scolarité apparaîtront ici."
        />
      </section>
    </div>
  );
}