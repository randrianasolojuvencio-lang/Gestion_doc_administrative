import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Plus, Save, LoaderCircle, CircleCheck, CircleAlert,
  BookOpen, FileText, ImagePlus, Trash2,
} from 'lucide-react';
import EtatVide from '../../composants/EtatVide';
import PhotoEtudiant from '../../composants/PhotoEtudiant';
import { controlerPhoto, reduirePhoto } from '../../utilitaires/photo';
import { aujourdhui, formaterDate } from '../../utilitaires/formatage';
import {
  obtenirEtudiant, listerReferences, creerInscription, modifierBordereauInscription,
  envoyerPhotoEtudiant, supprimerPhotoEtudiant,
} from '../../services/serviceApi';
import './PageFicheEtudiant.css';

// ===== Formulaire d'inscription (utilisé seulement dans cette page) =====
const CHAMPS_A_CHOISIR = [
  'code_annee_universitaire', 'code_niveau', 'code_parcour', 'code_groupe', 'code_statut_inscription',
];

// Une liste déroulante obligatoire, avec son message d'erreur
function ChoixObligatoire({ nom, libelle, valeur, erreur, surChangement, children }) {
  return (
    <div className={'champ-formulaire' + (erreur ? ' invalide' : '')}>
      <label htmlFor={`choix-${nom}`}>{libelle} *</label>
      <select id={`choix-${nom}`} name={nom} value={valeur} onChange={surChangement} aria-invalid={Boolean(erreur)}>
        <option value="">Choisir…</option>
        {children}
      </select>
      {erreur && <p className="erreur-champ">{erreur}</p>}
    </div>
  );
}

function FormulaireInscription({ numMatricule, surAjout, surAnnulation }) {
  const [references, setReferences] = useState(null); // listes de choix
  const [valeurs, setValeurs] = useState(() => ({
    code_annee_universitaire: '',
    code_niveau: '',
    code_parcour: '',
    code_groupe: '',
    code_statut_inscription: '',
    date_inscription: aujourdhui(),
    numero_bordereau: '',
  }));
  const [tentative, setTentative] = useState(false);
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [enCours, setEnCours] = useState(false);

  // Charge les listes de choix au premier affichage
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

  // Contrôles : chaque liste doit avoir une valeur, la date ne peut pas être dans le futur
  const erreurs = {};
  for (const nom of CHAMPS_A_CHOISIR) {
    if (!valeurs[nom]) erreurs[nom] = 'Choisissez une valeur dans la liste.';
  }
  if (valeurs.date_inscription > aujourdhui()) {
    erreurs.date_inscription = 'La date ne peut pas être dans le futur.';
  } else if (valeurs.date_inscription && valeurs.date_inscription < '2000-01-01') {
    erreurs.date_inscription = 'Date invalide.';
  }

  // Le bordereau de versement du droit d'inscription est obligatoire
  const bordereau = valeurs.numero_bordereau.trim();
  if (!bordereau) {
    erreurs.numero_bordereau = 'Le numéro du bordereau est obligatoire.';
  } else if (!/^[A-Za-z0-9/ -]{1,20}$/.test(bordereau)) {
    erreurs.numero_bordereau = 'Lettres, chiffres, espaces, tirets et barres obliques ; 20 caractères au plus.';
  }
  const message = (nom) => (tentative ? erreurs[nom] : '');

  function modifierChamp(evenement) {
    const { name, value } = evenement.target;
    // Le bordereau est saisi en majuscules
    setValeurs({ ...valeurs, [name]: name === 'numero_bordereau' ? value.toUpperCase() : value });
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setTentative(true);
    setErreurGenerale('');
    if (Object.keys(erreurs).length > 0) return;

    setEnCours(true);
    try {
      await creerInscription(numMatricule, { ...valeurs, numero_bordereau: bordereau });
      surAjout();
    } catch (err) {
      setErreurGenerale(err.message);
      setEnCours(false);
    }
  }

  if (!references) {
    return erreurGenerale
      ? <div className="message-erreur" role="alert"><CircleAlert size={20} /><span>{erreurGenerale}</span></div>
      : <p>Chargement des listes…</p>;
  }

  // Les listes de base doivent exister pour pouvoir inscrire
  const listesIncompletes = ['annees', 'niveaux', 'parcours', 'groupes', 'statuts_inscription']
    .some((liste) => references[liste].length === 0);

  // Les parcours sont regroupés par mention dans la liste déroulante
  const parcoursParMention = references.parcours.reduce((groupes, parcours) => {
    const mention = parcours.mention?.libelle_mention ?? 'Autres';
    (groupes[mention] ||= []).push(parcours);
    return groupes;
  }, {});

  return (
    <form onSubmit={soumettre} noValidate>
      {listesIncompletes && (
        <div className="message-erreur" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          <span>
            Il manque des données de base (année, niveau, parcours, groupe ou statut).{' '}
            <Link to="/donnees-de-base" className="lien-nom">Les ajouter dans « Données de base »</Link>
          </span>
        </div>
      )}
      {erreurGenerale && (
        <div className="message-erreur" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          <span>{erreurGenerale}</span>
        </div>
      )}

      <div className="grille-champs">
        <ChoixObligatoire nom="code_annee_universitaire" libelle="Année universitaire" valeur={valeurs.code_annee_universitaire} erreur={message('code_annee_universitaire')} surChangement={modifierChamp}>
          {references.annees.map((annee) => (
            <option key={annee.code_annee_universitaire} value={annee.code_annee_universitaire}>
              {annee.code_annee_universitaire}
            </option>
          ))}
        </ChoixObligatoire>

        <ChoixObligatoire nom="code_niveau" libelle="Niveau" valeur={valeurs.code_niveau} erreur={message('code_niveau')} surChangement={modifierChamp}>
          {references.niveaux.map((niveau) => (
            <option key={niveau.code_niveau} value={niveau.code_niveau}>{niveau.libelle_niveau}</option>
          ))}
        </ChoixObligatoire>

        <ChoixObligatoire nom="code_parcour" libelle="Parcours" valeur={valeurs.code_parcour} erreur={message('code_parcour')} surChangement={modifierChamp}>
          {Object.entries(parcoursParMention).map(([mention, parcoursDeLaMention]) => (
            <optgroup key={mention} label={mention}>
              {parcoursDeLaMention.map((parcours) => (
                <option key={parcours.code_parcour} value={parcours.code_parcour}>{parcours.libelle_parcour}</option>
              ))}
            </optgroup>
          ))}
        </ChoixObligatoire>

        <ChoixObligatoire nom="code_groupe" libelle="Groupe" valeur={valeurs.code_groupe} erreur={message('code_groupe')} surChangement={modifierChamp}>
          {references.groupes.map((groupe) => (
            <option key={groupe.code_groupe} value={groupe.code_groupe}>{groupe.libelle_groupe}</option>
          ))}
        </ChoixObligatoire>

        <ChoixObligatoire nom="code_statut_inscription" libelle="Statut" valeur={valeurs.code_statut_inscription} erreur={message('code_statut_inscription')} surChangement={modifierChamp}>
          {references.statuts_inscription.map((statut) => (
            <option key={statut.code_statut_inscription} value={statut.code_statut_inscription}>
              {statut.libelle_statut_inscription}
            </option>
          ))}
        </ChoixObligatoire>

        <div className={'champ-formulaire' + (message('date_inscription') ? ' invalide' : '')}>
          <label htmlFor="date_inscription">Date d'inscription</label>
          <input id="date_inscription" name="date_inscription" type="date" value={valeurs.date_inscription} onChange={modifierChamp} max={aujourdhui()} />
          {message('date_inscription') && <p className="erreur-champ">{message('date_inscription')}</p>}
        </div>

        <div className={'champ-formulaire' + (message('numero_bordereau') ? ' invalide' : '')}>
          <label htmlFor="numero_bordereau">Numéro du bordereau *</label>
          <input
            id="numero_bordereau"
            name="numero_bordereau"
            value={valeurs.numero_bordereau}
            maxLength={20}
            onChange={modifierChamp}
          />
          <p className="aide-champ">Bordereau de versement du droit d'inscription.</p>
          {message('numero_bordereau') && <p className="erreur-champ">{message('numero_bordereau')}</p>}
        </div>
      </div>

      <div className="actions-formulaire">
        <button type="button" className="bouton bouton-secondaire" onClick={surAnnulation}>Annuler</button>
        <button className="bouton" disabled={enCours || listesIncompletes}>
          {enCours
            ? <LoaderCircle size={18} className="tourner" aria-hidden="true" />
            : <Save size={18} aria-hidden="true" />}
          Enregistrer l'inscription
        </button>
      </div>
    </form>
  );
}

// ===== Page : fiche d'un étudiant =====
export default function PageFicheEtudiant() {
  const { numMatricule } = useParams();
  const location = useLocation();
  const [etudiant, setEtudiant] = useState(null);
  const [erreur, setErreur] = useState('');
  // Message de succès éventuel, transmis par la page de création ou de modification
  const [succes, setSucces] = useState(location.state?.message ?? '');
  const [inscriptionOuverte, setInscriptionOuverte] = useState(location.state?.ouvrirInscription ?? false);
  const [rechargement, setRechargement] = useState(0); // augmente pour recharger la fiche

  // Photo d'identité
  const [versionPhoto, setVersionPhoto] = useState(0); // augmente après chaque changement de photo
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState('');

  // Bordereau d'une inscription existante
  const [bordereauEnEdition, setBordereauEnEdition] = useState(null); // code de l'inscription en cours de saisie
  const [valeurBordereau, setValeurBordereau] = useState('');
  const [erreurBordereau, setErreurBordereau] = useState('');

  // Charge la fiche, et la recharge après chaque changement
  useEffect(() => {
    let annule = false;
    obtenirEtudiant(numMatricule)
      .then((donnees) => {
        if (!annule) {
          setEtudiant(donnees);
          setErreur('');
        }
      })
      .catch((err) => {
        if (!annule) setErreur(err.message);
      });
    return () => {
      annule = true;
    };
  }, [numMatricule, rechargement]);

  function apresInscription() {
    setInscriptionOuverte(false);
    setSucces('L\'inscription a été enregistrée.');
    setRechargement((n) => n + 1);
  }

  // Choisit une nouvelle photo, la réduit puis l'envoie
  async function changerPhoto(evenement) {
    const fichier = evenement.target.files?.[0];
    evenement.target.value = '';
    if (!fichier) return;

    setSucces('');
    const message = controlerPhoto(fichier);
    if (message) {
      setErreurPhoto(message);
      return;
    }

    setErreurPhoto('');
    setEnvoiPhoto(true);
    try {
      await envoyerPhotoEtudiant(numMatricule, await reduirePhoto(fichier));
      setVersionPhoto((n) => n + 1);
      setRechargement((n) => n + 1);
      setSucces('La photo a été enregistrée.');
    } catch (err) {
      setErreurPhoto(err.message);
    } finally {
      setEnvoiPhoto(false);
    }
  }

  // Retire la photo après confirmation
  async function retirerPhoto() {
    if (!window.confirm('Retirer la photo de cet étudiant ?')) return;
    setSucces('');
    setErreurPhoto('');
    try {
      await supprimerPhotoEtudiant(numMatricule);
      setVersionPhoto((n) => n + 1);
      setRechargement((n) => n + 1);
      setSucces('La photo a été retirée.');
    } catch (err) {
      setErreurPhoto(err.message);
    }
  }

  // Enregistre le numéro de bordereau d'une inscription existante
  async function enregistrerBordereau(inscription) {
    const valeur = valeurBordereau.trim().toUpperCase();
    if (!/^[A-Za-z0-9/ -]{1,20}$/.test(valeur)) {
      setErreurBordereau('Numéro invalide : lettres, chiffres, espaces, tirets et barres obliques ; 20 caractères au plus.');
      return;
    }

    setErreurBordereau('');
    try {
      await modifierBordereauInscription(numMatricule, inscription.code_inscription, valeur);
      setBordereauEnEdition(null);
      setSucces('Le numéro du bordereau a été enregistré.');
      setRechargement((n) => n + 1);
    } catch (err) {
      setErreurBordereau(err.message);
    }
  }

  if (erreur && !etudiant) {
    return (
      <div className="page-contenu">
        <Link to="/etudiants" className="lien-retour"><ArrowLeft size={16} aria-hidden="true" /> Retour à la liste</Link>
        <div className="message-erreur" role="alert"><CircleAlert size={20} /><span>{erreur}</span></div>
      </div>
    );
  }

  if (!etudiant) return <p className="chargement">Chargement…</p>;

  const adresseFiche = `/etudiants/${encodeURIComponent(etudiant.num_matricule)}`;

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <Link to="/etudiants" className="lien-retour">
            <ArrowLeft size={16} aria-hidden="true" /> Retour à la liste
          </Link>
          <h1>{etudiant.prenom} {etudiant.nom}</h1>
          <p className="sous-titre">Matricule {etudiant.num_matricule}</p>
        </div>
        <div className="actions-ligne">
          <Link to={`/demandes/nouvelle?etudiant=${encodeURIComponent(etudiant.num_matricule)}`} className="bouton">
            <FileText size={16} aria-hidden="true" /> Nouvelle demande
          </Link>
          <Link to={`${adresseFiche}/modifier`} className="bouton bouton-secondaire">
            <Pencil size={16} aria-hidden="true" /> Modifier
          </Link>
        </div>
      </header>

      {succes && (
        <div className="message-succes" role="status">
          <CircleCheck size={20} aria-hidden="true" />
          <span>{succes}</span>
        </div>
      )}

      <section className="panneau">
        <h2>Informations</h2>
        <div className="fiche-identite">
          <div className="bloc-photo">
            <PhotoEtudiant
              key={`${etudiant.num_matricule}-${versionPhoto}-${etudiant.a_photo}`}
              numMatricule={etudiant.num_matricule}
              aPhoto={etudiant.a_photo}
              version={versionPhoto}
              taille="grande"
              nom={`${etudiant.prenom ?? ''} ${etudiant.nom}`.trim()}
            />
            <label className="bouton bouton-secondaire bouton-petit bouton-fichier">
              {envoiPhoto
                ? <LoaderCircle size={15} className="tourner" aria-hidden="true" />
                : <ImagePlus size={15} aria-hidden="true" />}
              {etudiant.a_photo ? 'Changer la photo' : 'Ajouter une photo'}
              <input type="file" accept="image/jpeg,image/png" onChange={changerPhoto} disabled={envoiPhoto} />
            </label>
            {etudiant.a_photo && (
              <button type="button" className="bouton bouton-danger bouton-petit" onClick={retirerPhoto}>
                <Trash2 size={15} aria-hidden="true" /> Retirer
              </button>
            )}
            {erreurPhoto && <p className="erreur-champ">{erreurPhoto}</p>}
          </div>

          <dl className="liste-infos">
            <div><dt>Date de naissance</dt><dd>{formaterDate(etudiant.date_naissance)}</dd></div>
            <div><dt>Lieu de naissance</dt><dd>{etudiant.lieu_naissance ?? '—'}</dd></div>
            <div><dt>CIN</dt><dd>{etudiant.cin ?? '—'}</dd></div>
            <div><dt>E-mail</dt><dd>{etudiant.email ?? '—'}</dd></div>
            <div><dt>Téléphone</dt><dd>{etudiant.telephone ?? '—'}</dd></div>
            <div><dt>Adresse</dt><dd>{etudiant.adresse ?? '—'}</dd></div>
            <div><dt>Père</dt><dd>{[etudiant.prenom_pere, etudiant.nom_pere].filter(Boolean).join(' ') || '—'}</dd></div>
            <div><dt>Mère</dt><dd>{[etudiant.prenom_mere, etudiant.nom_mere].filter(Boolean).join(' ') || '—'}</dd></div>
          </dl>
        </div>
      </section>

      <section className="panneau">
        <div className="en-tete-panneau">
          <h2>Inscriptions</h2>
          {!inscriptionOuverte && (
            <button className="bouton bouton-petit" onClick={() => { setInscriptionOuverte(true); setSucces(''); }}>
              <Plus size={16} aria-hidden="true" /> Ajouter une inscription
            </button>
          )}
        </div>

        {inscriptionOuverte && (
          <div className="bloc-inscription">
            <FormulaireInscription
              numMatricule={etudiant.num_matricule}
              surAjout={apresInscription}
              surAnnulation={() => setInscriptionOuverte(false)}
            />
          </div>
        )}

        {etudiant.inscriptions.length === 0 ? (
          <EtatVide
            Icone={BookOpen}
            titre="Aucune inscription"
            texte="Utilisez « Ajouter une inscription » pour inscrire cet étudiant à une année universitaire."
          />
        ) : (
          <table className="tableau">
            <thead>
              <tr>
                <th>Année</th><th>Niveau</th><th>Parcours</th><th>Groupe</th>
                <th>Statut</th><th>Date</th><th>Bordereau</th>
              </tr>
            </thead>
            <tbody>
              {etudiant.inscriptions.map((inscription) => (
                <tr key={inscription.code_inscription}>
                  <td>{inscription.code_annee_universitaire}</td>
                  <td>{inscription.niveau?.libelle_niveau}</td>
                  <td>
                    {inscription.parcours?.libelle_parcour}
                    <span className="mention">{inscription.parcours?.mention?.libelle_mention}</span>
                  </td>
                  <td>{inscription.groupe?.libelle_groupe}</td>
                  <td>{inscription.statut_inscription?.libelle_statut_inscription}</td>
                  <td>{formaterDate(inscription.date_inscription)}</td>
                  <td>
                    {bordereauEnEdition === inscription.code_inscription ? (
                      <div className="edition-bordereau">
                        <input
                          value={valeurBordereau}
                          maxLength={20}
                          onChange={(e) => setValeurBordereau(e.target.value.toUpperCase())}
                          aria-label="Numéro du bordereau"
                        />
                        <button type="button" className="bouton bouton-petit" onClick={() => enregistrerBordereau(inscription)}>
                          Enregistrer
                        </button>
                        <button type="button" className="bouton bouton-secondaire bouton-petit" onClick={() => setBordereauEnEdition(null)}>
                          Annuler
                        </button>
                        {erreurBordereau && <span className="erreur-champ">{erreurBordereau}</span>}
                      </div>
                    ) : (
                      <div className="edition-bordereau">
                        {inscription.numero_bordereau ?? <span className="en-retard">Bordereau manquant</span>}
                        <button
                          type="button"
                          className="bouton bouton-secondaire bouton-petit"
                          onClick={() => {
                            setBordereauEnEdition(inscription.code_inscription);
                            setValeurBordereau(inscription.numero_bordereau ?? '');
                            setErreurBordereau('');
                          }}
                        >
                          {inscription.numero_bordereau ? 'Corriger' : 'Ajouter'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}