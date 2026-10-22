import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, LoaderCircle, CircleAlert } from 'lucide-react';
import { obtenirEtudiant, creerEtudiant, modifierEtudiant } from '../../services/serviceApi';
import './PageFormulaireEtudiant.css';

// ===== Champs du formulaire, regroupés par section =====
const SECTIONS = [
  {
    titre: 'Identité',
    champs: [
      { nom: 'num_matricule', libelle: 'Matricule', requis: true, longueurMax: 8 },
      { nom: 'nom', libelle: 'Nom', requis: true, longueurMax: 50 },
      { nom: 'prenom', libelle: 'Prénom', longueurMax: 50 },
      { nom: 'date_naissance', libelle: 'Date de naissance', type: 'date' },
      { nom: 'lieu_naissance', libelle: 'Lieu de naissance', longueurMax: 50 },
      { nom: 'cin', libelle: 'CIN (12 chiffres)', longueurMax: 12 },
    ],
  },
  {
    titre: 'Coordonnées',
    champs: [
      { nom: 'adresse', libelle: 'Adresse', longueurMax: 100 },
      { nom: 'email', libelle: 'E-mail', type: 'email', longueurMax: 50 },
      { nom: 'telephone', libelle: 'Téléphone', type: 'tel', longueurMax: 20 },
    ],
  },
  {
    titre: 'Parents',
    champs: [
      { nom: 'nom_pere', libelle: 'Nom du père', longueurMax: 50 },
      { nom: 'prenom_pere', libelle: 'Prénom du père', longueurMax: 50 },
      { nom: 'nom_mere', libelle: 'Nom de la mère', longueurMax: 50 },
      { nom: 'prenom_mere', libelle: 'Prénom de la mère', longueurMax: 50 },
    ],
  },
];

// Valeurs de départ : un texte vide pour chaque champ
const VALEURS_VIDES = Object.fromEntries(
  SECTIONS.flatMap((section) => section.champs.map((champ) => [champ.nom, '']))
);

// ===== Contrôles des champs =====
const REGLE_NOM = /^[\p{L}][\p{L} '’-]*$/u;            // lettres, espaces, apostrophes, tirets
const REGLE_LIEU = /^[\p{L}\d][\p{L}\d .,'’-]*$/u;     // idem avec chiffres et ponctuation simple

// Date du jour au format AAAA-MM-JJ (heure locale)
const aujourdhui = () => new Date().toLocaleDateString('en-CA');

// Contrôle d'un nom de personne, obligatoire ou facultatif
function controlerNom(valeur, obligatoire) {
  if (!valeur) return obligatoire ? 'Ce champ est obligatoire.' : '';
  if (valeur.length > 50) return '50 caractères au plus.';
  return REGLE_NOM.test(valeur) ? '' : 'Lettres, espaces, apostrophes et tirets uniquement.';
}

// Un contrôle par champ : renvoie le message d'erreur, ou '' si tout va bien
const CONTROLES = {
  num_matricule: (v) => {
    if (!v) return 'Le matricule est obligatoire.';
    return /^[A-Za-z0-9]{1,8}$/.test(v) ? '' : 'Lettres et chiffres uniquement, 8 caractères au plus.';
  },
  nom: (v) => controlerNom(v, true),
  prenom: (v) => controlerNom(v, false),
  date_naissance: (v) => {
    if (!v) return '';
    if (v > aujourdhui()) return 'La date ne peut pas être dans le futur.';
    return v < '1940-01-01' ? 'Date de naissance invalide.' : '';
  },
  lieu_naissance: (v) => (!v || REGLE_LIEU.test(v) ? '' : 'Caractères non autorisés.'),
  cin: (v) => (!v || /^\d{12}$/.test(v) ? '' : 'Le CIN contient exactement 12 chiffres.'),
  adresse: (v) => (v.length <= 100 ? '' : '100 caractères au plus.'),
  email: (v) => (!v || (v.length <= 50 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? '' : 'Adresse e-mail invalide.'),
  telephone: (v) => (!v || /^\+?[0-9 ]{9,20}$/.test(v) ? '' : 'Numéro invalide : chiffres et espaces, 9 à 20 caractères.'),
  nom_pere: (v) => controlerNom(v, false),
  prenom_pere: (v) => controlerNom(v, false),
  nom_mere: (v) => controlerNom(v, false),
  prenom_mere: (v) => controlerNom(v, false),
};

// Transforme les valeurs du serveur (null) en textes vides pour les champs
function versTextes(etudiant) {
  return Object.fromEntries(Object.keys(VALEURS_VIDES).map((nom) => [nom, etudiant[nom] ?? '']));
}

// Un champ de saisie avec son libellé et son message d'erreur
function Champ({ champ, valeur, message, desactive, surChangement, surSortie }) {
  const { nom, libelle, requis = false, longueurMax, type = 'text' } = champ;
  return (
    <div className={'champ-formulaire' + (message ? ' invalide' : '')}>
      <label htmlFor={`champ-${nom}`}>{libelle}{requis && ' *'}</label>
      <input
        id={`champ-${nom}`}
        name={nom}
        type={type}
        value={valeur}
        maxLength={longueurMax}
        disabled={desactive}
        onChange={surChangement}
        onBlur={surSortie}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? `erreur-${nom}` : undefined}
      />
      {message && <p className="erreur-champ" id={`erreur-${nom}`}>{message}</p>}
    </div>
  );
}

// Page de création (/etudiants/nouveau) et de modification (/etudiants/:numMatricule/modifier)
export default function PageFormulaireEtudiant() {
  const { numMatricule } = useParams();
  const modification = Boolean(numMatricule);
  const navigate = useNavigate();

  const [valeurs, setValeurs] = useState(VALEURS_VIDES);
  const [chargement, setChargement] = useState(modification);
  const [touches, setTouches] = useState({});          // champs que l'agent a déjà quittés
  const [tentative, setTentative] = useState(false);   // vrai après un clic sur Enregistrer
  const [erreursServeur, setErreursServeur] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [enCours, setEnCours] = useState(false);

  const cheminRetour = modification ? `/etudiants/${encodeURIComponent(numMatricule)}` : '/etudiants';

  // En modification, on charge l'étudiant pour remplir le formulaire
  useEffect(() => {
    if (!modification) return undefined;
    let annule = false;
    obtenirEtudiant(numMatricule)
      .then((etudiant) => {
        if (!annule) {
          setValeurs(versTextes(etudiant));
          setChargement(false);
        }
      })
      .catch((err) => {
        if (!annule) {
          setErreurGenerale(err.message);
          setChargement(false);
        }
      });
    return () => {
      annule = true;
    };
  }, [modification, numMatricule]);

  // Erreur de contrôle de chaque champ (le matricule n'est pas contrôlé en modification)
  const erreursChamps = Object.fromEntries(
    Object.keys(VALEURS_VIDES).map((nom) => [
      nom,
      modification && nom === 'num_matricule' ? '' : CONTROLES[nom](valeurs[nom].trim()),
    ])
  );

  // Message affiché sous un champ : contrôle local (après passage dans le champ), sinon erreur du serveur
  const messageChamp = (nom) =>
    ((touches[nom] || tentative) && erreursChamps[nom]) || erreursServeur[nom] || '';

  function modifierChamp(evenement) {
    const { name, value } = evenement.target;
    setValeurs({ ...valeurs, [name]: value });
    setErreursServeur({ ...erreursServeur, [name]: '' });
  }

  function quitterChamp(evenement) {
    setTouches({ ...touches, [evenement.target.name]: true });
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setTentative(true);
    setErreurGenerale('');

    if (Object.values(erreursChamps).some(Boolean)) {
      setErreurGenerale('Corrigez les champs signalés en rouge.');
      return;
    }

    // Nettoyage : espaces retirés, matricule en majuscules, e-mail en minuscules, champs vides = null
    const donnees = Object.fromEntries(
      Object.entries(valeurs).map(([nom, valeur]) => {
        let texte = valeur.trim();
        if (nom === 'num_matricule') texte = texte.toUpperCase();
        if (nom === 'email') texte = texte.toLowerCase();
        return [nom, texte === '' ? null : texte];
      })
    );

    setEnCours(true);
    try {
      if (modification) {
        await modifierEtudiant(numMatricule, donnees);
        navigate(cheminRetour, { state: { message: 'Les informations de l\'étudiant ont été enregistrées.' } });
      } else {
        const etudiant = await creerEtudiant(donnees);
        navigate(`/etudiants/${encodeURIComponent(etudiant.num_matricule)}`, {
          state: { message: 'L\'étudiant a été enregistré. Vous pouvez maintenant ajouter son inscription.' },
        });
      }
    } catch (err) {
      // Les erreurs du serveur sont affichées sous les champs concernés
      if (err.erreurs) {
        setErreursServeur(
          Object.fromEntries(Object.entries(err.erreurs).map(([nom, messages]) => [nom, messages[0]]))
        );
      }
      setErreurGenerale(err.message);
      setEnCours(false);
    }
  }

  if (chargement) return <p className="chargement">Chargement…</p>;

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <Link to={cheminRetour} className="lien-retour">
            <ArrowLeft size={16} aria-hidden="true" /> {modification ? 'Retour à la fiche' : 'Retour à la liste'}
          </Link>
          <h1>{modification ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}</h1>
          {!modification && (
            <p className="sous-titre">Après l'enregistrement, vous pourrez ajouter son inscription.</p>
          )}
        </div>
      </header>

      <section className="panneau">
        {/* noValidate : les contrôles sont faits par la page, avec ses propres messages */}
        <form onSubmit={soumettre} noValidate className="formulaire-etudiant">
          {erreurGenerale && (
            <div className="message-erreur" role="alert">
              <CircleAlert size={20} aria-hidden="true" />
              <span>{erreurGenerale}</span>
            </div>
          )}

          {SECTIONS.map((section) => (
            <fieldset key={section.titre}>
              <legend>{section.titre}</legend>
              <div className="grille-champs">
                {section.champs.map((champ) => (
                  <Champ
                    key={champ.nom}
                    champ={champ}
                    valeur={valeurs[champ.nom]}
                    message={messageChamp(champ.nom)}
                    desactive={modification && champ.nom === 'num_matricule'}
                    surChangement={modifierChamp}
                    surSortie={quitterChamp}
                  />
                ))}
              </div>
            </fieldset>
          ))}

          <div className="actions-formulaire">
            <button type="button" className="bouton bouton-secondaire" onClick={() => navigate(cheminRetour)}>
              Annuler
            </button>
            <button className="bouton" disabled={enCours}>
              {enCours
                ? <LoaderCircle size={18} className="tourner" aria-hidden="true" />
                : <Save size={18} aria-hidden="true" />}
              {modification ? 'Enregistrer les modifications' : 'Enregistrer l\'étudiant'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}