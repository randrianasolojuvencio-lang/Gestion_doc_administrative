import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Plus, Save, LoaderCircle, CircleCheck, CircleAlert, BookOpen,
} from 'lucide-react';
import EtatVide from '../../composants/EtatVide';
import { obtenirEtudiant, listerReferences, creerInscription } from '../../services/serviceApi';
import './PageFicheEtudiant.css';

// Affiche une date AAAA-MM-JJ sous la forme JJ/MM/AAAA
function formaterDate(valeur) {
  return valeur ? valeur.split('-').reverse().join('/') : '—';
}

// Date du jour au format AAAA-MM-JJ (heure locale)
const aujourdhui = () => new Date().toLocaleDateString('en-CA');

const CHAMPS_A_CHOISIR = [
  'code_annee_universitaire', 'code_niveau', 'code_parcour', 'code_groupe', 'code_statut_inscription',
];

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
  const [references, setReferences] = useState(null);
  const [valeurs, setValeurs] = useState(() => ({
    code_annee_universitaire: '',
    code_niveau: '',
    code_parcour: '',
    code_groupe: '',
    code_statut_inscription: '',
    date_inscription: aujourdhui(),
  }));
  const [tentative, setTentative] = useState(false);
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [enCours, setEnCours] = useState(false);

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

  const erreurs = {};
  for (const nom of CHAMPS_A_CHOISIR) {
    if (!valeurs[nom]) erreurs[nom] = 'Choisissez une valeur dans la liste.';
  }
  if (valeurs.date_inscription > aujourdhui()) {
    erreurs.date_inscription = 'La date ne peut pas être dans le futur.';
  } else if (valeurs.date_inscription && valeurs.date_inscription < '2000-01-01') {
    erreurs.date_inscription = 'Date invalide.';
  }
  const message = (nom) => (tentative ? erreurs[nom] : '');

  function modifierChamp(evenement) {
    setValeurs({ ...valeurs, [evenement.target.name]: evenement.target.value });
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setTentative(true);
    setErreurGenerale('');
    if (Object.keys(erreurs).length > 0) return;

    setEnCours(true);
    try {
      await creerInscription(numMatricule, valeurs);
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

  const listesIncompletes = ['annees', 'niveaux', 'parcours', 'groupes', 'statuts_inscription']
    .some((liste) => references[liste].length === 0);

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
      </div>

      <div className="actions-formulaire">
        <button type="button" className="bouton bouton-secondaire" onClick={surAnnulation}>Annuler</button>
        <button className="bouton" disabled={enCours || listesIncompletes}>
          {enCours ? <LoaderCircle size={18} className="tourner" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
          Enregistrer l'inscription
        </button>
      </div>
    </form>
  );
}

export default function PageFicheEtudiant() {
  const { numMatricule } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [etudiant, setEtudiant] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(location.state?.message ?? '');
  const [inscriptionOuverte, setInscriptionOuverte] = useState(location.state?.ouvrirInscription ?? false);
  const [rechargement, setRechargement] = useState(0);

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
    setSucces("L'inscription a été enregistrée.");
    setRechargement((n) => n + 1);
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
        <button 
          onClick={() => navigate(`/etudiants/${encodeURIComponent(etudiant.num_matricule)}/modifier`)} 
          className="bouton bouton-secondaire"
        >
          <Pencil size={16} aria-hidden="true" /> Modifier
        </button>
      </header>

      {succes && (
        <div className="message-succes" role="status">
          <CircleCheck size={20} aria-hidden="true" />
          <span>{succes}</span>
        </div>
      )}

      <section className="panneau">
        <h2>Informations</h2>
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
              <tr><th>Année</th><th>Niveau</th><th>Parcours</th><th>Groupe</th><th>Statut</th><th>Date</th></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}