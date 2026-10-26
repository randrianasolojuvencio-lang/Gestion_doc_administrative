import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, useParams } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Save, LoaderCircle, CircleCheck, CircleAlert, Inbox,
} from 'lucide-react';
import EtatVide from '../../composants/EtatVide';
import {
  listerDonneesBase, creerDonneeBase, modifierDonneeBase, supprimerDonneeBase,
} from '../../services/serviceApi';
import { RUBRIQUES } from './configurationRubriques';
import './PageDonneesDeBase.css';

// Contrôle d'un champ : renvoie le message d'erreur, ou '' si tout va bien
function controlerChamp(champ, valeur) {
  if (!valeur) return champ.requis ? 'Ce champ est obligatoire.' : '';
  if (champ.longueurMax && valeur.length > champ.longueurMax) return `${champ.longueurMax} caractères au plus.`;
  if (champ.motif && !champ.motif.test(valeur)) return champ.messageMotif;
  return champ.controle ? champ.controle(valeur) : '';
}

// ===== Formulaire d'ajout et de modification (même formulaire pour toutes les rubriques) =====
function FormulaireDonnee({ rubrique, element, dependances, surEnregistre, surAnnulation }) {
  const creation = element === null;
  const [valeurs, setValeurs] = useState(() =>
    Object.fromEntries(rubrique.champs.map((champ) => [champ.nom, element?.[champ.nom] ?? '']))
  );
  const [tentative, setTentative] = useState(false);
  const [erreursServeur, setErreursServeur] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [enCours, setEnCours] = useState(false);

  // Erreur de contrôle de chaque champ
  const erreurs = Object.fromEntries(
    rubrique.champs.map((champ) => [champ.nom, controlerChamp(champ, valeurs[champ.nom].trim())])
  );
  // Message affiché sous un champ : contrôle local (après un clic sur Enregistrer), sinon erreur du serveur
  const message = (nom) => (tentative && erreurs[nom]) || erreursServeur[nom] || '';

  function modifierChamp(champ, valeur) {
    const valeurFinale = champ.majuscules ? valeur.toUpperCase() : valeur;
    setValeurs({ ...valeurs, [champ.nom]: valeurFinale });
    setErreursServeur({ ...erreursServeur, [champ.nom]: '' });
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setTentative(true);
    setErreurGenerale('');

    if (Object.values(erreurs).some(Boolean)) {
      setErreurGenerale('Corrigez les champs signalés en rouge.');
      return;
    }

    // Un champ vide est envoyé comme "pas de valeur" (null)
    const donnees = Object.fromEntries(
      Object.entries(valeurs).map(([nom, valeur]) => [nom, valeur.trim() === '' ? null : valeur.trim()])
    );

    setEnCours(true);
    try {
      if (creation) {
        await creerDonneeBase(rubrique.cle, donnees);
      } else {
        await modifierDonneeBase(rubrique.cle, element[rubrique.cleCode], donnees);
      }
      surEnregistre(creation ? 'Élément ajouté.' : 'Modifications enregistrées.');
    } catch (err) {
      if (err.erreurs) {
        setErreursServeur(
          Object.fromEntries(Object.entries(err.erreurs).map(([nom, messages]) => [nom, messages[0]]))
        );
      }
      setErreurGenerale(err.message);
      setEnCours(false);
    }
  }

  return (
    <form className="formulaire-donnee" onSubmit={soumettre} noValidate>
      <h3>{creation ? 'Ajouter' : 'Modifier'}</h3>

      {erreurGenerale && (
        <div className="message-erreur" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          <span>{erreurGenerale}</span>
        </div>
      )}

      <div className="grille-champs">
        {rubrique.champs.map((champ) => {
          const erreur = message(champ.nom);
          const desactive = !creation && champ.estCode; // le code ne change pas après l'ajout

          // Choix d'une liste déroulante : valeurs fixes, ou éléments d'une autre rubrique
          let choix = null;
          let rubriqueSource = null;
          if (champ.type === 'choix') {
            if (champ.options) {
              choix = champ.options.map((option) => ({ valeur: option, texte: option }));
            } else {
              rubriqueSource = RUBRIQUES.find((r) => r.cle === champ.source);
              choix = (dependances[champ.source] ?? []).map((autre) => ({
                valeur: autre[champ.cleValeur],
                texte: champ.texte(autre),
              }));
            }
          }

          return (
            <div key={champ.nom} className={'champ-formulaire' + (erreur ? ' invalide' : '')}>
              <label htmlFor={`donnee-${champ.nom}`}>{champ.libelle}{champ.requis && ' *'}</label>
              {choix ? (
                <select
                  id={`donnee-${champ.nom}`}
                  value={valeurs[champ.nom]}
                  onChange={(e) => modifierChamp(champ, e.target.value)}
                  aria-invalid={Boolean(erreur)}
                >
                  <option value="">Choisir…</option>
                  {choix.map((c) => <option key={c.valeur} value={c.valeur}>{c.texte}</option>)}
                </select>
              ) : (
                <input
                  id={`donnee-${champ.nom}`}
                  value={valeurs[champ.nom]}
                  maxLength={champ.longueurMax}
                  disabled={desactive}
                  placeholder={champ.exemple ? `Exemple : ${champ.exemple}` : undefined}
                  onChange={(e) => modifierChamp(champ, e.target.value)}
                  aria-invalid={Boolean(erreur)}
                />
              )}
              {rubriqueSource && choix.length === 0 && (
                <p className="aide-champ">Aucun choix : ajoutez d'abord un élément dans « {rubriqueSource.titre} ».</p>
              )}
              {erreur && <p className="erreur-champ">{erreur}</p>}
            </div>
          );
        })}
      </div>

      <div className="actions-formulaire">
        <button type="button" className="bouton bouton-secondaire" onClick={surAnnulation}>Annuler</button>
        <button className="bouton" disabled={enCours}>
          {enCours
            ? <LoaderCircle size={18} className="tourner" aria-hidden="true" />
            : <Save size={18} aria-hidden="true" />}
          Enregistrer
        </button>
      </div>
    </form>
  );
}

// ===== Liste d'une rubrique, avec son formulaire =====
function ListeRubrique({ rubrique }) {
  const [elements, setElements] = useState(null);       // null tant que la liste n'est pas chargée
  const [dependances, setDependances] = useState({});   // listes des autres rubriques utilisées par le formulaire
  const [edition, setEdition] = useState(undefined);    // undefined : fermé, null : ajout, objet : modification
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const [rechargement, setRechargement] = useState(0);

  // Charge la liste de la rubrique et celles dont elle dépend
  useEffect(() => {
    let annule = false;
    Promise.all([
      listerDonneesBase(rubrique.cle),
      ...rubrique.dependances.map((dependance) => listerDonneesBase(dependance)),
    ])
      .then(([liste, ...listesLiees]) => {
        if (annule) return;
        setElements(liste);
        setDependances(Object.fromEntries(rubrique.dependances.map((dep, i) => [dep, listesLiees[i]])));
        setErreur('');
      })
      .catch((err) => {
        if (!annule) setErreur(err.message);
      });
    return () => {
      annule = true;
    };
  }, [rubrique, rechargement]);

  function apresEnregistrement(texte) {
    setEdition(undefined);
    setSucces(texte);
    setRechargement((n) => n + 1);
  }

  async function supprimer(element) {
    if (!window.confirm('Supprimer cet élément ?')) return;
    setSucces('');
    setErreur('');
    try {
      await supprimerDonneeBase(rubrique.cle, element[rubrique.cleCode]);
      setSucces('Élément supprimé.');
      setRechargement((n) => n + 1);
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <section className="panneau">
      <div className="en-tete-panneau">
        <div>
          <h2>{rubrique.titre}</h2>
          <p className="sous-titre">{rubrique.description}</p>
        </div>
        {edition === undefined && (
          <button className="bouton bouton-petit" onClick={() => { setEdition(null); setSucces(''); }}>
            <Plus size={16} aria-hidden="true" /> Ajouter
          </button>
        )}
      </div>

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

      {edition !== undefined && (
        <FormulaireDonnee
          key={edition === null ? 'ajout' : edition[rubrique.cleCode]}
          rubrique={rubrique}
          element={edition}
          dependances={dependances}
          surEnregistre={apresEnregistrement}
          surAnnulation={() => setEdition(undefined)}
        />
      )}

      {elements === null && !erreur && <p className="texte-discret">Chargement…</p>}

      {elements !== null && elements.length === 0 && (
        <EtatVide Icone={Inbox} titre="Aucun élément" texte="Utilisez « Ajouter » pour créer le premier." />
      )}

      {elements !== null && elements.length > 0 && (
        <table className="tableau">
          <thead>
            <tr>
              {rubrique.colonnes.map((colonne) => <th key={colonne.libelle}>{colonne.libelle}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {elements.map((element) => (
              <tr key={element[rubrique.cleCode]}>
                {rubrique.colonnes.map((colonne) => <td key={colonne.libelle}>{colonne.valeur(element)}</td>)}
                <td className="actions-ligne">
                  <button
                    className="bouton bouton-secondaire bouton-petit"
                    onClick={() => { setEdition(element); setSucces(''); }}
                  >
                    <Pencil size={15} aria-hidden="true" /> Modifier
                  </button>
                  <button className="bouton bouton-danger bouton-petit" onClick={() => supprimer(element)}>
                    <Trash2 size={15} aria-hidden="true" /> Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ===== Page mère : onglets des rubriques et liste de la rubrique choisie =====
export default function PageDonneesDeBase() {
  const { rubrique: cleRubrique } = useParams();
  const rubrique = RUBRIQUES.find((r) => r.cle === cleRubrique);

  // Sans rubrique valide dans l'adresse, on ouvre la première
  if (!rubrique) return <Navigate to={`/donnees-de-base/${RUBRIQUES[0].cle}`} replace />;

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <h1>Données de base</h1>
          <p className="sous-titre">
            Listes utilisées par les inscriptions et les documents. Remplissez-les dans l'ordre des onglets.
          </p>
        </div>
      </header>

      <nav className="onglets" aria-label="Rubriques">
        {RUBRIQUES.map(({ cle, titre, Icone }) => (
          <NavLink
            key={cle}
            to={`/donnees-de-base/${cle}`}
            className={({ isActive }) => 'onglet' + (isActive ? ' actif' : '')}
          >
            <Icone size={16} aria-hidden="true" /> {titre}
          </NavLink>
        ))}
      </nav>

      {/* La clé remet la liste à zéro quand on change d'onglet */}
      <ListeRubrique key={rubrique.cle} rubrique={rubrique} />

      <p className="texte-discret">
        Les agents sont gérés depuis le menu de votre profil, en bas à gauche. {' '}
        <Link to="/agents" className="lien-nom">Gestion des agents</Link>
      </p>
    </div>
  );
}