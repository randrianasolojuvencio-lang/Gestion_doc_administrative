import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote, Receipt, Download, LoaderCircle, ChevronLeft, ChevronRight, CircleAlert,
} from 'lucide-react';
import EtatVide from '../../composants/EtatVide';
import { obtenirEtatComptable, telechargerEtatComptable, listerReferences } from '../../services/serviceApi';
import { aujourdhui, debutDuMois, formaterDate, formaterMontant } from '../../utilitaires/formatage';
import './PageComptabilite.css';

// Recettes de la période : totaux, répartition par type de document, et fichier à remettre aux comptables
export default function PageComptabilite() {
  // Par défaut : du début du mois à aujourd'hui, tous les types
  const [filtres, setFiltres] = useState(() => ({ du: debutDuMois(), au: aujourdhui(), type: '' }));
  const [types, setTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [etat, setEtat] = useState(null);
  const [erreur, setErreur] = useState('');
  const [enExport, setEnExport] = useState(false);

  const periodeInvalide = Boolean(filtres.du && filtres.au && filtres.du > filtres.au);

  // Liste des types de documents pour le filtre
  useEffect(() => {
    let annule = false;
    listerReferences()
      .then((donnees) => {
        if (!annule) setTypes(donnees.types_documents);
      })
      .catch(() => {
        // Sans liste, le filtre par type n'a simplement aucun choix
      });
    return () => {
      annule = true;
    };
  }, []);

  // Charge l'état à l'ouverture, puis à chaque changement de période, de type ou de page
  useEffect(() => {
    if (periodeInvalide) return undefined;
    let annule = false;
    obtenirEtatComptable(filtres, page)
      .then((donnees) => {
        if (!annule) {
          setEtat(donnees);
          setErreur('');
        }
      })
      .catch((err) => {
        if (!annule) setErreur(err.message);
      });
    return () => {
      annule = true;
    };
  }, [filtres, page, periodeInvalide]);

  function changerFiltre(cle, valeur) {
    setFiltres({ ...filtres, [cle]: valeur });
    setPage(1);
  }

  async function exporter() {
    setErreur('');
    setEnExport(true);
    try {
      await telechargerEtatComptable(filtres);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnExport(false);
    }
  }

  const lignes = etat?.lignes?.data ?? [];

  return (
    <div className="page-contenu">
      <header className="en-tete-page">
        <div>
          <h1>Comptabilité</h1>
          <p className="sous-titre">Recettes des documents payants, à remettre aux comptables.</p>
        </div>
        <button className="bouton" onClick={exporter} disabled={enExport || periodeInvalide || etat?.totaux.nombre === 0}>
          {enExport
            ? <LoaderCircle size={18} className="tourner" aria-hidden="true" />
            : <Download size={18} aria-hidden="true" />}
          Exporter pour Excel
        </button>
      </header>

      <section className="panneau">
        <div className="filtres-periode">
          <div className="champ-formulaire">
            <label htmlFor="date-debut">Du</label>
            <input id="date-debut" type="date" max={aujourdhui()} value={filtres.du} onChange={(e) => changerFiltre('du', e.target.value)} />
          </div>
          <div className="champ-formulaire">
            <label htmlFor="date-fin">Au</label>
            <input id="date-fin" type="date" max={aujourdhui()} value={filtres.au} onChange={(e) => changerFiltre('au', e.target.value)} />
          </div>
          <div className="champ-formulaire">
            <label htmlFor="type-document">Type de document</label>
            <select id="type-document" value={filtres.type} onChange={(e) => changerFiltre('type', e.target.value)}>
              <option value="">Tous les types</option>
              {types.map((t) => <option key={t.code_doc} value={t.code_doc}>{t.libelle_doc}</option>)}
            </select>
          </div>
        </div>
        {periodeInvalide && <p className="erreur-champ">La date de fin ne peut pas précéder la date de début.</p>}
      </section>

      {erreur && (
        <div className="message-erreur" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          <span>{erreur}</span>
        </div>
      )}

      {etat && !periodeInvalide && (
        <>
          <section className="cartes-chiffres">
            <div className="carte-chiffre">
              <span className="carte-chiffre-icone"><Banknote size={20} aria-hidden="true" /></span>
              <div>
                <strong>{formaterMontant(etat.totaux.total)}</strong>
                <span>Total encaissé</span>
              </div>
            </div>
            <div className="carte-chiffre">
              <span className="carte-chiffre-icone"><Receipt size={20} aria-hidden="true" /></span>
              <div>
                <strong>{etat.totaux.nombre}</strong>
                <span>Demandes payantes</span>
              </div>
            </div>
          </section>

          {etat.totaux.nombre === 0 ? (
            <section className="panneau">
              <EtatVide
                Icone={Banknote}
                titre="Aucune recette sur cette période"
                texte="Les demandes de documents payants apparaissent ici avec leur montant."
              />
            </section>
          ) : (
            <>
              <section className="panneau">
                <h2>Par type de document</h2>
                <table className="tableau">
                  <thead>
                    <tr><th>Type de document</th><th className="montant">Demandes</th><th className="montant">Total</th></tr>
                  </thead>
                  <tbody>
                    {etat.par_type.map((ligne) => (
                      <tr key={ligne.code_doc}>
                        <td>{ligne.libelle}</td>
                        <td className="montant">{ligne.nombre}</td>
                        <td className="montant">{formaterMontant(ligne.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="panneau">
                <h2>Détail des demandes</h2>
                <table className="tableau">
                  <thead>
                    <tr>
                      <th>Date</th><th>Référence</th><th>Étudiant</th><th>Document</th>
                      <th className="montant">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((ligne) => (
                      <tr key={ligne.reference_demande}>
                        <td>{formaterDate(ligne.date_demande)}</td>
                        <td>
                          <Link to={`/demandes/${encodeURIComponent(ligne.reference_demande)}`} className="lien-nom">
                            {ligne.reference_demande}
                          </Link>
                        </td>
                        <td>
                          {ligne.etudiant}
                          <span className="sous-ligne">{ligne.num_matricule}</span>
                        </td>
                        <td>{ligne.type}</td>
                        <td className="montant">{formaterMontant(ligne.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pagination">
                  <span>{etat.lignes.total} demande(s) · page {etat.lignes.current_page} sur {etat.lignes.last_page}</span>
                  <button className="bouton bouton-secondaire bouton-petit" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft size={15} aria-hidden="true" /> Précédent
                  </button>
                  <button className="bouton bouton-secondaire bouton-petit" disabled={page >= etat.lignes.last_page} onClick={() => setPage(page + 1)}>
                    Suivant <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {etat === null && !erreur && <p className="texte-discret">Chargement…</p>}
    </div>
  );
}