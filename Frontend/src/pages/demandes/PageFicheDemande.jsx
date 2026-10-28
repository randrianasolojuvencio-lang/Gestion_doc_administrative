import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, CircleCheck, Circle, CircleAlert, LoaderCircle, ArrowRight, Clock,
} from 'lucide-react';
import PhotoEtudiant from '../../composants/PhotoEtudiant';
import { obtenirDemande, avancerDemande } from '../../services/serviceApi';
import {
  aujourdhui, formaterDate, formaterDateHeure, formaterMontant, LIBELLES_FABRICANT,
} from '../../utilitaires/formatage';
import './PageFicheDemande.css';

// Fiche d'une demande : informations, étapes du circuit et action à faire
export default function PageFicheDemande() {
  const { reference } = useParams();
  const location = useLocation();

  const [demande, setDemande] = useState(null);
  const [erreur, setErreur] = useState('');
  // Message de succès éventuel, transmis par la page de création
  const [succes, setSucces] = useState(location.state?.message ?? '');
  const [signataire, setSignataire] = useState('');            // responsable choisi pour la signature
  const [dateAction, setDateAction] = useState(aujourdhui());  // date de signature ou de remise
  const [identiteVerifiee, setIdentiteVerifiee] = useState(false); // case cochée à la remise
  const [enCours, setEnCours] = useState(false);

  // Charge la demande
  useEffect(() => {
    let annule = false;
    obtenirDemande(reference)
      .then((donnees) => {
        if (!annule) {
          setDemande(donnees);
          setErreur('');
        }
      })
      .catch((err) => {
        if (!annule) setErreur(err.message);
      });
    return () => {
      annule = true;
    };
  }, [reference]);

  if (erreur && !demande) {
    return (
      <div className="page-contenu">
        <Link to="/demandes" className="lien-retour"><ArrowLeft size={16} aria-hidden="true" /> Retour aux demandes</Link>
        <div className="message-erreur" role="alert"><CircleAlert size={20} /><span>{erreur}</span></div>
      </div>
    );
  }

  if (!demande) return <p className="chargement">Chargement…</p>;

  const type = demande.type_document;
  const suivant = demande.etape_suivante;
  const termine = suivant === null;
  const enRetard = !termine && demande.date_prevue < aujourdhui();
  const document = demande.documents?.[0];
  const identite = `${demande.etudiant?.prenom ?? ''} ${demande.etudiant?.nom ?? ''}`.trim();

  // Fait passer la demande à l'étape suivante
  async function executer() {
    setErreur('');
    setSucces('');

    let corps = {};
    if (suivant === 'SIGN') {
      if (!signataire) {
        setErreur('Choisissez le responsable qui signe le document.');
        return;
      }
      corps = { matricule_responsable: signataire, date_finition: dateAction };
    }
    if (suivant === 'DELI') {
      if (!identiteVerifiee) {
        setErreur('Confirmez que vous avez vérifié l\'identité de l\'étudiant.');
        return;
      }
      if (!window.confirm('Confirmer la remise du document à l\'étudiant ? La demande sera terminée.')) return;
      corps = { date_remise_doc: dateAction, identite_verifiee: true };
    }

    setEnCours(true);
    try {
      const miseAJour = await avancerDemande(reference, corps);
      setDemande(miseAJour);
      setSucces(`Étape enregistrée : ${miseAJour.statut_actuel.libelle}.`);
      setSignataire('');
      setDateAction(aujourdhui());
      setIdentiteVerifiee(false);
    } catch (err) {
      setErreur(err.message);
    } finally {
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
          <h1>Demande {demande.reference_demande}</h1>
          <p className="sous-titre">{type.libelle_doc} · enregistrée le {formaterDateHeure(demande.date_demande)}</p>
        </div>
        <span className="badge-statut">{demande.statut_actuel?.libelle}</span>
      </header>

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

      {/* Action à faire : une seule étape à la fois */}
      <section className="panneau panneau-action">
        {termine ? (
          <>
            <h2>Demande terminée</h2>
            <p>Le document a été remis à l'étudiant le {formaterDate(document?.date_remise_doc)}.</p>
          </>
        ) : (
          <>
            <h2>Étape suivante : {demande.action_suivante}</h2>

            {suivant === 'SIGN' && (
              <div className="grille-champs grille-action">
                <div className="champ-formulaire">
                  <label htmlFor="signataire">Responsable qui signe *</label>
                  <select id="signataire" value={signataire} onChange={(e) => setSignataire(e.target.value)}>
                    <option value="">Choisir…</option>
                    {demande.signataires_possibles.map((s) => (
                      <option key={s.matricule_responsable} value={s.matricule_responsable}>
                        {s.nom_responsable} {s.prenom_responsable} ({s.fonction})
                      </option>
                    ))}
                  </select>
                  {demande.signataires_possibles.length === 0 && (
                    <p className="erreur-champ">
                      Aucun responsable ne peut signer. Ajoutez le directeur et les responsables de mention dans{' '}
                      <Link to="/donnees-de-base/administration" className="lien-nom">Données de base</Link>.
                    </p>
                  )}
                </div>
                <div className="champ-formulaire">
                  <label htmlFor="date-action">Date de signature</label>
                  <input id="date-action" type="date" max={aujourdhui()} value={dateAction} onChange={(e) => setDateAction(e.target.value)} />
                </div>
              </div>
            )}

            {/* Remise : l'agent vérifie l'identité de l'étudiant avec sa photo */}
            {suivant === 'DELI' && (
              <div className="verification-identite">
                <PhotoEtudiant
                  key={demande.num_matricule}
                  numMatricule={demande.num_matricule}
                  aPhoto={demande.etudiant?.a_photo}
                  taille="grande"
                  nom={identite}
                />
                <div>
                  <p>
                    Vérifiez que la personne présente est bien <strong>{identite}</strong>{' '}
                    (matricule {demande.num_matricule}).
                  </p>
                  {!demande.etudiant?.a_photo && (
                    <p className="texte-discret">Pas de photo enregistrée : vérifiez son identité avec sa carte (CIN).</p>
                  )}
                  <label className="case-verification">
                    <input type="checkbox" checked={identiteVerifiee} onChange={(e) => setIdentiteVerifiee(e.target.checked)} />
                    J'ai vérifié l'identité de l'étudiant
                  </label>
                  <div className="champ-formulaire">
                    <label htmlFor="date-action">Date de remise</label>
                    <input id="date-action" type="date" max={aujourdhui()} value={dateAction} onChange={(e) => setDateAction(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <button type="button" className="bouton" onClick={executer} disabled={enCours}>
              {enCours
                ? <LoaderCircle size={18} className="tourner" aria-hidden="true" />
                : <ArrowRight size={18} aria-hidden="true" />}
              {demande.action_suivante}
            </button>
          </>
        )}
      </section>

      <div className="deux-colonnes">
        {/* Étapes du circuit */}
        <section className="panneau">
          <h2>Avancement</h2>
          <ol className="chronologie">
            {demande.etapes.map((etape) => {
              const atteinte = Boolean(etape.date);
              const courante = etape.code === demande.statut_actuel?.code;
              return (
                <li key={etape.code} className={'etape' + (atteinte ? ' atteinte' : '') + (courante ? ' courante' : '')}>
                  {atteinte
                    ? <CircleCheck size={20} aria-hidden="true" />
                    : <Circle size={20} aria-hidden="true" />}
                  <div>
                    <strong>{etape.libelle}</strong>
                    {atteinte && <span className="etape-date">{formaterDateHeure(etape.date)}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Informations de la demande */}
        <section className="panneau">
          <h2>Informations</h2>
          <dl className="liste-infos liste-infos-etroite">
            <div>
              <dt>Étudiant</dt>
              <dd>
                <Link to={`/etudiants/${encodeURIComponent(demande.num_matricule)}`} className="lien-nom">
                  {demande.etudiant?.nom} {demande.etudiant?.prenom}
                </Link>
                <span className="sous-ligne">Matricule {demande.num_matricule}</span>
              </dd>
            </div>
            <div><dt>Réceptionnée par</dt><dd>{demande.agent?.nom_personnel} {demande.agent?.prenom_personnel}</dd></div>
            <div><dt>Fabriqué par</dt><dd>{LIBELLES_FABRICANT[type.fabricant]}{type.visa_requis && ' · visa du bureau 003'}</dd></div>
            <div>
              <dt>Délai</dt>
              <dd className={enRetard ? 'en-retard' : undefined}>
                {type.delai} jour(s) · prévu le {formaterDate(demande.date_prevue)}
                {enRetard && (<> <Clock size={14} aria-hidden="true" /> en retard</>)}
              </dd>
            </div>
            <div><dt>Montant payé</dt><dd>{formaterMontant(demande.montant)}</dd></div>
            <div><dt>Précisions</dt><dd>{demande.description ?? '—'}</dd></div>
            <div>
              <dt>Inscription(s) concernée(s)</dt>
              <dd>
                {demande.inscriptions.map((inscription) => (
                  <span className="sous-ligne-texte" key={inscription.code_inscription}>
                    {inscription.code_annee_universitaire} · {inscription.niveau?.code_niveau} · {inscription.parcours?.code_parcour} · {inscription.groupe?.libelle_groupe}
                    {' · '}bordereau {inscription.numero_bordereau}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Document fabriqué */}
      {document && (
        <section className="panneau">
          <h2>Document</h2>
          <dl className="liste-infos">
            <div><dt>Document</dt><dd>{document.libelle_doc_demande}</dd></div>
            <div>
              <dt>Signé par</dt>
              <dd>
                {document.responsable
                  ? `${document.responsable.nom_responsable} ${document.responsable.prenom_responsable ?? ''} (${document.responsable.fonction})`
                  : 'Pas encore signé'}
              </dd>
            </div>
            <div><dt>Date de signature</dt><dd>{formaterDate(document.date_finition)}</dd></div>
            <div><dt>Date de remise</dt><dd>{formaterDate(document.date_remise_doc)}</dd></div>
          </dl>
        </section>
      )}
    </div>
  );
}