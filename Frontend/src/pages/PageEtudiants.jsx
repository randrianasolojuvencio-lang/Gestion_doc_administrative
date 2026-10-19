import { GraduationCap } from 'lucide-react';
import EtatVide from '../composants/EtatVide';

// Page des étudiants (la liste est à construire)
export default function PageEtudiants() {
  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <h1>Étudiants</h1>
          <p className="sous-titre">Recherche d'un étudiant et de ses inscriptions.</p>
        </div>
      </header>
      <section className="panneau">
        <EtatVide
          Icone={GraduationCap}
          titre="Cette page arrive bientôt"
          texte="La recherche des étudiants sera ajoutée après les demandes."
        />
      </section>
    </div>
  );
}