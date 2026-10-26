import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, UserPlus, GraduationCap, ChevronLeft, ChevronRight,
  CircleAlert, CircleCheck, Plus, Pencil, Trash2, X,
} from 'lucide-react';
import EtatVide from '../../composants/EtatVide';
import EnteteFiltre from '../../composants/EnteteFiltre';
import { listerEtudiants, supprimerEtudiant, listerReferences } from '../../services/serviceApi';
import './PageEtudiants.css';

const FILTRES_VIDES = { niveau: '', parcours: '', groupe: '', annee: '' };

// Liste des étudiants : recherche, filtres par en-tête de colonne et actions
export default function PageEtudiants() {
  const [recherche, setRecherche] = useState('');               // ce que l'agent tape
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState(''); // ce qui est envoyé au serveur
  const [filtres, setFiltres] = useState(FILTRES_VIDES);        // niveau, parcours, groupe, année
  const [references, setReferences] = useState(null);           // listes de choix des filtres
  const [page, setPage] = useState(1);
  const [resultat, setResultat] = useState(null);               // réponse paginée du serveur
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [rechargement, setRechargement] = useState(0);          // augmente pour recharger la liste

  // Attend 300 ms après la dernière frappe avant de lancer la recherche
  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRechercheEnvoyee(recherche);
      setPage(1); // une nouvelle recherche repart de la première page
    }, 300);
    return () => clearTimeout(minuteur);
  }, [recherche]);

  // Charge les listes de choix des filtres (niveaux, parcours, groupes, années)
  useEffect(() => {
    let annule = false;
    listerReferences()
      .then((donnees) => {
        if (!annule) setReferences(donnees);
      })
      .catch(() => {
        // Sans listes, les filtres n'ont simplement aucun choix à proposer
      });
    return () => {
      annule = true;
    };
  }, []);

  // Charge la liste dès l'ouverture, puis à chaque changement de recherche, de filtre ou de page
  useEffect(() => {
    let annule = false;
    listerEtudiants(rechercheEnvoyee, page, filtres)
      .then((donnees) => {
        if (!annule) {
          setResultat(donnees);
          setErreur('');
        }
      })
      .catch((err) => {
        if (!annule) setErreur(err.message);
      });
    return () => {
      annule = true;
    };
  }, [rechercheEnvoyee, page, filtres, rechargement]);

  // Choix des listes de chaque en-tête
  const optionsNiveaux = (references?.niveaux ?? []).map((n) => ({ valeur: n.code_niveau, texte: n.libelle_niveau }));
  const optionsParcours = (references?.parcours ?? []).map((p) => ({ valeur: p.code_parcour, texte: p.libelle_parcour }));
  const optionsGroupes = (references?.groupes ?? []).map((g) => ({ valeur: g.code_groupe, texte: g.libelle_groupe }));
  const optionsAnnees = (references?.annees ?? []).map((a) => ({
    valeur: a.code_annee_universitaire,
    texte: a.code_annee_universitaire,
  }));

  const filtresActifs = Object.values(filtres).some(Boolean);
  const etudiants = resultat?.data ?? [];

  function changerFiltre(cle, valeur) {
    setFiltres({ ...filtres, [cle]: valeur });
    setPage(1); // un nouveau filtre repart de la première page
  }

  function reinitialiserFiltres() {
    setFiltres(FILTRES_VIDES);
    setPage(1);
  }

  // Supprime un étudiant après confirmation (le serveur refuse s'il a des inscriptions ou des demandes)
  async function supprimer(etudiant) {
    const identite = `${etudiant.nom} ${etudiant.prenom ?? ''}`.trim();
    if (!window.confirm(`Supprimer l'étudiant ${identite} ?\nCette action est définitive.`)) return;

    setSucces('');
    setErreur('');
    try {
      await supprimerEtudiant(etudiant.num_matricule);
      setSucces('L\'étudiant a été supprimé.');
      // Si c'était le dernier de la page, on revient à la page précédente
      if (etudiants.length === 1 && page > 1) setPage(page - 1);
      setRechargement((n) => n + 1);
    } catch (err) {
      setErreur(err.message);
    }
  }

  // Le tableau reste affiché quand un filtre ne donne aucun résultat, pour pouvoir le changer
  const afficherTableau = resultat !== null && (etudiants.length > 0 || filtresActifs);

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
            onChange={(evenement) => setRecherche(evenement.target.value)}
            aria-label="Rechercher un étudiant"
          />
        </div>

        {filtresActifs && (
          <div className="barre-filtres">
            <span>Filtres actifs : cliquez sur un en-tête de colonne pour les changer.</span>
            <button type="button" className="bouton bouton-secondaire bouton-petit" onClick={reinitialiserFiltres}>
              <X size={14} aria-hidden="true" /> Réinitialiser les filtres
            </button>
          </div>
        )}

        {succes && (
          <div className="message-succes" role="status">
            <CircleCheck size={20} aria-hidden="true" />
            <span>{succes}</span>
          </div>
        )}
        {erreur && (
          <div className="message-erreur" role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <span>{erreur}</span>
          </div>
        )}

        {/* Tant que le serveur n'a pas répondu */}
        {resultat === null && !erreur && <p className="texte-discret">Chargement des étudiants…</p>}

        {resultat && etudiants.length === 0 && !filtresActifs && (
          <EtatVide
            Icone={GraduationCap}
            titre={rechercheEnvoyee ? 'Aucun étudiant trouvé' : 'Aucun étudiant enregistré'}
            texte={rechercheEnvoyee ? 'Vérifiez l\'orthographe ou essayez un autre mot.' : 'Utilisez « Nouvel étudiant » pour en ajouter un.'}
          />
        )}

        {afficherTableau && (
          <>
            <table className="tableau">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom et prénom</th>
                  <th>
                    <EnteteFiltre libelle="Niveau" libelleTous="Tous les niveaux" valeur={filtres.niveau}
                      options={optionsNiveaux} surChangement={(v) => changerFiltre('niveau', v)} />
                  </th>
                  <th>
                    <EnteteFiltre libelle="Parcours" libelleTous="Tous les parcours" valeur={filtres.parcours}
                      options={optionsParcours} surChangement={(v) => changerFiltre('parcours', v)} />
                  </th>
                  <th>
                    <EnteteFiltre libelle="Groupe" libelleTous="Tous les groupes" valeur={filtres.groupe}
                      options={optionsGroupes} surChangement={(v) => changerFiltre('groupe', v)} />
                  </th>
                  <th>
                    <EnteteFiltre libelle="Année" libelleTous="Toutes les années" valeur={filtres.annee}
                      options={optionsAnnees} surChangement={(v) => changerFiltre('annee', v)} />
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="non-inscrit">
                      Aucun étudiant ne correspond à ces filtres.
                    </td>
                  </tr>
                )}

                {etudiants.map((etudiant) => {
                  // Avec des filtres : l'inscription qui correspond ; sinon la plus récente
                  const inscription = etudiant.inscriptions?.[0];
                  const adresseFiche = `/etudiants/${encodeURIComponent(etudiant.num_matricule)}`;

                  return (
                    <tr key={etudiant.num_matricule}>
                      <td>{etudiant.num_matricule}</td>
                      <td>
                        <Link to={adresseFiche} className="lien-nom">
                          {etudiant.nom} {etudiant.prenom}
                        </Link>
                      </td>

                      {/* Niveau, parcours, groupe et année : 4 cellules, ou une seule si pas d'inscription */}
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

                      {/* Actions : une seule cellule, à la fin de la ligne */}
                      <td>
                        <div className="actions-ligne">
                          {inscription ? (
                            <Link to={adresseFiche} className="bouton bouton-secondaire bouton-petit">
                              Voir la fiche
                            </Link>
                          ) : (
                            <Link to={adresseFiche} state={{ ouvrirInscription: true }} className="bouton bouton-petit">
                              <Plus size={15} aria-hidden="true" /> Inscrire
                            </Link>
                          )}
                          <Link to={`${adresseFiche}/modifier`} className="bouton bouton-secondaire bouton-petit">
                            <Pencil size={15} aria-hidden="true" /> Modifier
                          </Link>
                          <button type="button" className="bouton bouton-danger bouton-petit" onClick={() => supprimer(etudiant)}>
                            <Trash2 size={15} aria-hidden="true" /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {etudiants.length > 0 && (
              <div className="pagination">
                <span>{resultat.total} étudiant(s) · page {resultat.current_page} sur {resultat.last_page}</span>
                <button className="bouton bouton-secondaire bouton-petit" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={15} aria-hidden="true" /> Précédent
                </button>
                <button className="bouton bouton-secondaire bouton-petit" disabled={page >= resultat.last_page} onClick={() => setPage(page + 1)}>
                  Suivant <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}