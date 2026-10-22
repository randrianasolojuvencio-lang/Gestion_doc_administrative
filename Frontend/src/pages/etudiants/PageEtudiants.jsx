import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, GraduationCap, ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';
import EtatVide from '../../composants/EtatVide';
import { listerEtudiants } from '../../services/serviceApi';
import './PageEtudiants.css';

// Liste des étudiants avec recherche par matricule, nom ou prénom
export default function PageEtudiants() {
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [resultat, setResultat] = useState(null); // réponse paginée du serveur
  const [erreur, setErreur] = useState('');

  // Recharge la liste quand la recherche ou la page change.
  // Un court délai évite d'interroger le serveur à chaque lettre tapée.
  useEffect(() => {
    let annule = false;
    const minuteur = setTimeout(() => {
      listerEtudiants(recherche, page)
        .then((donnees) => {
          if (!annule) {
            setResultat(donnees);
            setErreur('');
          }
        })
        .catch((err) => {
          if (!annule) setErreur(err.message);
        });
    }, 300);

    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [recherche, page]);

  function changerRecherche(evenement) {
    setRecherche(evenement.target.value);
    setPage(1); // une nouvelle recherche repart de la première page
  }

  const etudiants = resultat?.data ?? [];

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <h1>Étudiants</h1>
          <p className="sous-titre">Recherche d'un étudiant et de ses inscriptions.</p>
        </div>
        <Link to="/etudiants/nouveau" className="bouton">
          <UserPlus size={18} aria-hidden="true" /> Nouvel étudiant
        </Link>
      </header>

      <section className="panneau">
        <div className="recherche">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Rechercher par matricule, nom ou prénom"
            value={recherche}
            onChange={changerRecherche}
            aria-label="Rechercher un étudiant"
          />
        </div>

        {erreur && (
          <div className="message-erreur" role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <span>{erreur}</span>
          </div>
        )}

        {resultat && etudiants.length === 0 && (
          <EtatVide
            Icone={GraduationCap}
            titre={recherche ? 'Aucun étudiant trouvé' : 'Aucun étudiant enregistré'}
            texte={recherche ? 'Vérifiez l\'orthographe ou essayez un autre mot.' : 'Utilisez « Nouvel étudiant » pour en ajouter un.'}
          />
        )}

        {etudiants.length > 0 && (
          <>
            <table className="tableau">
              <thead>
                <tr>
                  <th>Matricule</th><th>Nom et prénom</th><th>Niveau</th>
                  <th>Parcours</th><th>Groupe</th><th>Année</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.map((etudiant) => {
                  const inscription = etudiant.derniere_inscription;
                  return (
                    <tr key={etudiant.num_matricule}>
                      <td>{etudiant.num_matricule}</td>
                      <td>
                        <Link to={`/etudiants/${encodeURIComponent(etudiant.num_matricule)}`} className="lien-nom">
                          {etudiant.nom} {etudiant.prenom}
                        </Link>
                      </td>
                      {inscription ? (
                        <>
                          <td>{inscription.niveau?.libelle_niveau}</td>
                          <td>{inscription.parcours?.libelle_parcour}</td>
                          <td>{inscription.groupe?.libelle_groupe}</td>
                          <td>{inscription.code_annee_universitaire}</td>
                        </>
                      ) : (
                        <td colSpan={4} className="non-inscrit">Aucune inscription</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination">
              <span>{resultat.total} étudiant(s) · page {resultat.current_page} sur {resultat.last_page}</span>
              <button className="bouton bouton-secondaire bouton-petit" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={15} aria-hidden="true" /> Précédent
              </button>
              <button className="bouton bouton-secondaire bouton-petit" disabled={page >= resultat.last_page} onClick={() => setPage(page + 1)}>
                Suivant <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}