import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, FileText, ChevronLeft, ChevronRight, CircleAlert, X, Eye,
} from 'lucide-react';
import EtatVide from '../../composants/EtatVide';
import EnteteFiltre from '../../composants/EnteteFiltre';
import { listerDemandes, listerReferences } from '../../services/serviceApi';
import { aujourdhui, formaterDate } from '../../utilitaires/formatage';
import './PageDemandes.css';

const FILTRES_VIDES = { statut: '', type: '' };

// Liste des demandes de documents : recherche, filtres par en-tête de colonne et accès à chaque demande
export default function PageDemandes() {
  const [recherche, setRecherche] = useState('');               // ce que l'agent tape
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState(''); // ce qui est envoyé au serveur
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [references, setReferences] = useState(null);           // listes de choix des filtres
  const [page, setPage] = useState(1);
  const [resultat, setResultat] = useState(null);               // réponse paginée du serveur
  const [erreur, setErreur] = useState('');

  // Attend 300 ms après la dernière frappe avant de lancer la recherche
  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRechercheEnvoyee(recherche);
      setPage(1);
    }, 300);
    return () => clearTimeout(minuteur);
  }, [recherche]);

  // Charge les listes de choix des filtres (statuts et types de documents)
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
    listerDemandes(rechercheEnvoyee, page, filtres)
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
  }, [rechercheEnvoyee, page, filtres]);

  const optionsStatuts = (references?.statuts_demande ?? []).map((s) => ({ valeur: s.code_statut, texte: s.type_statut }));
  const optionsTypes = (references?.types_documents ?? []).map((t) => ({
    valeur: t.code_doc, texte: `${t.code_doc} · ${t.libelle_doc}`, court: t.code_doc,
  }));

  const filtresActifs = Object.values(filtres).some(Boolean);
  const demandes = resultat?.data ?? [];

  function changerFiltre(cle, valeur) {
    setFiltres({ ...filtres, [cle]: valeur });
    setPage(1);
  }

  const afficherTableau = resultat !== null && (demandes.length > 0 || filtresActifs);

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <h1>Demandes</h1>
          <p className="sous-titre">Suivi des demandes de documents des étudiants.</p>
        </div>
        <Link to="/demandes/nouvelle" className="bouton">
          <Plus size={18} aria-hidden="true" /> Nouvelle demande
        </Link>
      </header>

      <section className="panneau">
        <div className="recherche">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Rechercher par référence, matricule, nom ou prénom"
            value={recherche}
            onChange={(evenement) => setRecherche(evenement.target.value)}
            aria-label="Rechercher une demande"
          />
        </div>

        {filtresActifs && (
          <div className="barre-filtres">
            <span>Filtres actifs : cliquez sur un en-tête de colonne pour les changer.</span>
            <button type="button" className="bouton bouton-secondaire bouton-petit" onClick={() => { setFiltres(FILTRES_VIDES); setPage(1); }}>
              <X size={14} aria-hidden="true" /> Réinitialiser les filtres
            </button>
          </div>
        )}

        {erreur && (
          <div className="message-erreur" role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <span>{erreur}</span>
          </div>
        )}

        {resultat === null && !erreur && <p className="texte-discret">Chargement des demandes…</p>}

        {resultat && demandes.length === 0 && !filtresActifs && (
          <EtatVide
            Icone={FileText}
            titre={rechercheEnvoyee ? 'Aucune demande trouvée' : 'Aucune demande enregistrée'}
            texte={rechercheEnvoyee ? 'Vérifiez l\'orthographe ou essayez un autre mot.' : 'Utilisez « Nouvelle demande » pour en enregistrer une.'}
          />
        )}

        {afficherTableau && (
          <>
            <table className="tableau">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Étudiant</th>
                  <th>
                    <EnteteFiltre libelle="Type de document" libelleTous="Tous les types" valeur={filtres.type}
                      options={optionsTypes} surChangement={(v) => changerFiltre('type', v)} />
                  </th>
                  <th>Date</th>
                  <th>
                    <EnteteFiltre libelle="Statut" libelleTous="Tous les statuts" valeur={filtres.statut}
                      options={optionsStatuts} surChangement={(v) => changerFiltre('statut', v)} />
                  </th>
                  <th>Prévu le</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {demandes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="non-inscrit">Aucune demande ne correspond à ces filtres.</td>
                  </tr>
                )}

                {demandes.map((demande) => {
                  const statut = demande.statut_actuel;
                  // En retard : la date prévue est passée et le document n'est pas encore délivré
                  const enRetard = statut?.code !== 'DELI' && demande.date_prevue < aujourdhui();
                  const adresse = `/demandes/${encodeURIComponent(demande.reference_demande)}`;

                  return (
                    <tr key={demande.reference_demande}>
                      <td><Link to={adresse} className="lien-nom">{demande.reference_demande}</Link></td>
                      <td>
                        {demande.etudiant?.nom} {demande.etudiant?.prenom}
                        <span className="sous-ligne">{demande.num_matricule}</span>
                      </td>
                      <td>{demande.type_document?.libelle_doc}</td>
                      <td>{formaterDate(demande.date_demande)}</td>
                      <td><span className="badge-statut">{statut?.libelle}</span></td>
                      <td className={enRetard ? 'en-retard' : undefined}>
                        {formaterDate(demande.date_prevue)}{enRetard && ' · en retard'}
                      </td>
                      <td>
                        <Link to={adresse} className="bouton bouton-secondaire bouton-petit">
                          <Eye size={15} aria-hidden="true" /> Ouvrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {demandes.length > 0 && (
              <div className="pagination">
                <span>{resultat.total} demande(s) · page {resultat.current_page} sur {resultat.last_page}</span>
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