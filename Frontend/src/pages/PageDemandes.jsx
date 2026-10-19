import { FileText } from 'lucide-react';
import EtatVide from '../composants/EtatVide';

// Page des demandes de documents (la liste et la saisie sont à construire)
export default function PageDemandes() {
  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <h1>Demandes</h1>
          <p className="sous-titre">Suivi des demandes de documents des étudiants.</p>
        </div>
      </header>
      <section className="panneau">
        <EtatVide
          Icone={FileText}
          titre="Cette page arrive bientôt"
          texte="La saisie d'une nouvelle demande et la liste des demandes seront ajoutées à la prochaine étape."
        />
      </section>
    </div>
  );
}