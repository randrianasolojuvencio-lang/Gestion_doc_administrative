import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Save, LoaderCircle, CircleAlert } from 'lucide-react';
import {
  listerEtudiants, obtenirEtudiant, listerReferences, creerDemande,
} from '../../services/serviceApi';
import { LIBELLES_FABRICANT, formaterMontant } from '../../utilitaires/formatage';
import './PageNouvelleDemande.css';

// Par défaut, la demande se base sur l'inscription payée la plus récente de l'étudiant
const inscriptionParDefaut = (fiche) => {
  const payee = fiche.inscriptions.find((inscription) => inscription.numero_bordereau);
  return payee ? [payee.code_inscription] : [];
};

// Enregistrement d'une nouvelle demande : étudiant, inscriptions payées, type de document
export default function PageNouvelleDemande() {
  const navigate = useNavigate();
  const [parametres] = useSearchParams();
  const matriculeInitial = parametres.get('etudiant') ?? ''; // utilisé depuis la fiche d'un étudiant

  const [etudiant, setEtudiant] = useState(null);       // étudiant choisi, avec ses inscriptions
  const [recherche, setRecherche] = useState('');
  const [propositions, setPropositions] = useState([]);
  const [references, setReferences] = useState(null);
  const [inscriptions, setInscriptions] = useState([]); // codes des inscriptions cochées
  const [codeDoc, setCodeDoc] = useState('');
  const [description, setDescription] = useState('');
  const [tentative, setTentative] = useState(false);
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [enCours, setEnCours] = useState(false);

  // Étudiant déjà choisi dans l'adresse (venant de sa fiche)
  useEffect(() => {
    if (!matriculeInitial) return undefined;
    let annule = false;
    obtenirEtudiant(matriculeInitial)
      .then((fiche) => {
        if (!annule) {
          setEtudiant(fiche);
          setInscriptions(inscriptionParDefaut(fiche));
        }
      })
      .catch((err) => {
        if (!annule) setErreurGenerale(err.message);
      });
    return () => {
      annule = true;
    };
  }, [matriculeInitial]);

  // Listes de choix : types de documents
  useEffect(() => {
    let annule = false;
    listerReferences()
      .then((donnees) => {
        if (!annule) setReferences(donnees);
      })
      .catch((err) => {
        if (!annule) setErreurGenerale(err.message);
      });
    return () => {
      annule = true;
    };
  }, []);

  // Recherche d'étudiant pendant la frappe (au moins 2 caractères)
  useEffect(() => {
    if (etudiant || recherche.trim().length < 2) return undefined;
    let annule = false;
    const minuteur = setTimeout(() => {
      listerEtudiants(recherche.trim(), 1)
        .then((donnees) => {
          if (!annule) setPropositions(donnees.data);
        })
        .catch((err) => {
          if (!annule) setErreurGenerale(err.message);
        });
    }, 300);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [recherche, etudiant]);

  const propositionsAffichees = !etudiant && recherche.trim().length >= 2 ? propositions : [];
  const types = references?.types_documents ?? [];
  const type = types.find((t) => t.code_doc === codeDoc);

  // Choisit un étudiant dans la liste de recherche
  async function choisirEtudiant(numMatricule) {
    setErreurGenerale('');
    try {
      const fiche = await obtenirEtudiant(numMatricule);
      setEtudiant(fiche);
      setInscriptions(inscriptionParDefaut(fiche));
    } catch (err) {
      setErreurGenerale(err.message);
    }
  }

  function changerEtudiant() {
    setEtudiant(null);
    setInscriptions([]);
    setRecherche('');
  }

  function cocher(code) {
    setInscriptions(
      inscriptions.includes(code) ? inscriptions.filter((c) => c !== code) : [...inscriptions, code]
    );
  }

  // Contrôles de la page
  const erreurs = {};
  if (!etudiant) erreurs.etudiant = 'Choisissez un étudiant.';
  if (etudiant && inscriptions.length === 0) erreurs.inscriptions = 'Cochez au moins une inscription payée.';
  if (!codeDoc) erreurs.code_doc = 'Choisissez le type de document.';
  if (description.length > 100) erreurs.description = '100 caractères au plus.';

  async function soumettre(evenement) {
    evenement.preventDefault();
    setTentative(true);
    setErreurGenerale('');
    if (Object.keys(erreurs).length > 0) return;

    setEnCours(true);
    try {
      const reponse = await creerDemande({
        num_matricule: etudiant.num_matricule,
        code_doc: codeDoc,
        inscriptions,
        description: description.trim() || null,
      });
      navigate(`/demandes/${encodeURIComponent(reponse.reference_demande)}`, {
        state: { message: 'La demande a été enregistrée. Vous pouvez maintenant l\'orienter.' },
      });
    } catch (err) {
      setErreurGenerale(err.message);
      setEnCours(false);
    }
  }

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <Link to="/demandes" className="lien-retour">
            <ArrowLeft size={16} aria-hidden="true" /> Retour aux demandes
          </Link>
          <h1>Nouvelle demande</h1>
          <p className="sous-titre">Choisissez l'étudiant, ses inscriptions payées et le document demandé.</p>
        </div>
      </header>

      <form onSubmit={soumettre} noValidate>
        {erreurGenerale && (
          <div className="message-erreur" role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <span>{erreurGenerale}</span>
          </div>
        )}

        {/* 1. L'étudiant */}
        <section className="panneau">
          <h2>1. Étudiant</h2>

          {etudiant ? (
            <div className="etudiant-choisi">
              <div>
                <strong>{etudiant.nom} {etudiant.prenom}</strong>
                <span className="sous-ligne">Matricule {etudiant.num_matricule}</span>
              </div>
              <button type="button" className="bouton bouton-secondaire bouton-petit" onClick={changerEtudiant}>
                Changer
              </button>
            </div>
          ) : (
            <>
              <div className="recherche">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Rechercher par matricule, nom ou prénom (2 lettres au moins)"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  aria-label="Rechercher un étudiant"
                />
              </div>
              {propositionsAffichees.length > 0 && (
                <ul className="propositions">
                  {propositionsAffichees.map((proposition) => (
                    <li key={proposition.num_matricule}>
                      <button type="button" className="proposition" onClick={() => choisirEtudiant(proposition.num_matricule)}>
                        <span>{proposition.nom} {proposition.prenom}</span>
                        <span>{proposition.num_matricule}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {tentative && erreurs.etudiant && <p className="erreur-champ">{erreurs.etudiant}</p>}
            </>
          )}
        </section>

        {/* 2. La demande */}
        {etudiant && (
          <section className="panneau">
            <h2>2. Demande</h2>

            <div className={'champ-formulaire' + (tentative && erreurs.inscriptions ? ' invalide' : '')}>
              <label>Inscriptions sur lesquelles la demande se base *</label>

              {etudiant.inscriptions.length === 0 ? (
                <p className="texte-discret">
                  Cet étudiant n'a aucune inscription.{' '}
                  <Link
                    to={`/etudiants/${encodeURIComponent(etudiant.num_matricule)}`}
                    state={{ ouvrirInscription: true }}
                    className="lien-nom"
                  >
                    Inscrire l'étudiant
                  </Link>
                </p>
              ) : (
                <>
                  <div className="liste-cases">
                    {etudiant.inscriptions.map((inscription) => {
                      // Seules les inscriptions dont le droit est payé (bordereau enregistré) sont cochables
                      const payee = Boolean(inscription.numero_bordereau);
                      return (
                        <label key={inscription.code_inscription} className={payee ? undefined : 'case-desactivee'}>
                          <input
                            type="checkbox"
                            checked={inscriptions.includes(inscription.code_inscription)}
                            disabled={!payee}
                            onChange={() => cocher(inscription.code_inscription)}
                          />
                          <span>
                            {inscription.code_annee_universitaire} · {inscription.niveau?.libelle_niveau} ·{' '}
                            {inscription.parcours?.libelle_parcour} · {inscription.groupe?.libelle_groupe}
                            {' · '}
                            {payee ? `bordereau ${inscription.numero_bordereau}` : 'bordereau manquant'}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {!etudiant.inscriptions.some((inscription) => inscription.numero_bordereau) && (
                    <p className="erreur-champ">
                      Aucune inscription n'est justifiée par un bordereau.{' '}
                      <Link to={`/etudiants/${encodeURIComponent(etudiant.num_matricule)}`} className="lien-nom">
                        Ajouter le bordereau sur la fiche de l'étudiant
                      </Link>
                    </p>
                  )}
                </>
              )}
              {tentative && erreurs.inscriptions && <p className="erreur-champ">{erreurs.inscriptions}</p>}
            </div>

            <div className="grille-champs grille-demande">
              <div className={'champ-formulaire' + (tentative && erreurs.code_doc ? ' invalide' : '')}>
                <label htmlFor="type-document">Type de document *</label>
                <select id="type-document" value={codeDoc} onChange={(e) => setCodeDoc(e.target.value)}>
                  <option value="">Choisir…</option>
                  {types.map((t) => <option key={t.code_doc} value={t.code_doc}>{t.libelle_doc}</option>)}
                </select>
                {tentative && erreurs.code_doc && <p className="erreur-champ">{erreurs.code_doc}</p>}
                {references && types.length === 0 && (
                  <p className="texte-discret">
                    Aucun type de document. <Link to="/donnees-de-base/types-documents" className="lien-nom">Les ajouter</Link>
                  </p>
                )}
              </div>

              <div className={'champ-formulaire' + (tentative && erreurs.description ? ' invalide' : '')}>
                <label htmlFor="description-demande">Précisions (facultatif)</label>
                <input
                  id="description-demande"
                  value={description}
                  maxLength={100}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {tentative && erreurs.description && <p className="erreur-champ">{erreurs.description}</p>}
              </div>
            </div>

            {/* Ce qui va se passer pour ce type de document */}
            {type && (
              <div className="infos-type">
                <p><strong>Fabriqué par :</strong> {LIBELLES_FABRICANT[type.fabricant]}</p>
                <p><strong>Délai :</strong> {type.delai} jour(s) · <strong>Tarif :</strong> {formaterMontant(type.tarif)}</p>
                <p><strong>Visa du bureau 003 :</strong> {type.visa_requis ? 'oui' : 'non'}</p>
              </div>
            )}
          </section>
        )}

        <div className="actions-formulaire">
          <button type="button" className="bouton bouton-secondaire" onClick={() => navigate('/demandes')}>Annuler</button>
          <button className="bouton" disabled={enCours}>
            {enCours
              ? <LoaderCircle size={18} className="tourner" aria-hidden="true" />
              : <Save size={18} aria-hidden="true" />}
            Enregistrer la demande
          </button>
        </div>
      </form>
    </div>
  );
}