import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './EnteteFiltre.css';

// En-tête de colonne qui s'ouvre en liste de choix pour filtrer un tableau.
// options : [{ valeur, texte }] ; valeur : le choix actuel ('' = tous)
export default function EnteteFiltre({ libelle, libelleTous, valeur, options, surChangement }) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef(null);

  // Ferme la liste quand on clique ailleurs ou qu'on appuie sur Échap
  useEffect(() => {
    function fermerSiClicDehors(evenement) {
      if (zone.current && !zone.current.contains(evenement.target)) setOuvert(false);
    }
    function fermerSiEchap(evenement) {
      if (evenement.key === 'Escape') setOuvert(false);
    }

    document.addEventListener('mousedown', fermerSiClicDehors);
    document.addEventListener('keydown', fermerSiEchap);
    return () => {
      document.removeEventListener('mousedown', fermerSiClicDehors);
      document.removeEventListener('keydown', fermerSiEchap);
    };
  }, []);

  const choisie = options.find((option) => option.valeur === valeur);

  function choisir(nouvelleValeur) {
    surChangement(nouvelleValeur);
    setOuvert(false);
  }

  return (
    <div className="entete-filtre" ref={zone}>
      <button
        type="button"
        className={'entete-filtre-bouton' + (valeur ? ' actif' : '')}
        onClick={() => setOuvert(!ouvert)}
        aria-haspopup="true"
        aria-expanded={ouvert}
        title={`Filtrer par ${libelle.toLowerCase()}`}
      >
        {libelle}
        {choisie && <span className="entete-filtre-valeur">{choisie.texte}</span>}
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {ouvert && (
        <ul className="entete-filtre-liste">
          <li>
            <button type="button" className={'entete-filtre-option' + (!valeur ? ' choisie' : '')} onClick={() => choisir('')}>
              {libelleTous} {!valeur && <Check size={14} aria-hidden="true" />}
            </button>
          </li>
          {options.map((option) => (
            <li key={option.valeur}>
              <button
                type="button"
                className={'entete-filtre-option' + (option.valeur === valeur ? ' choisie' : '')}
                onClick={() => choisir(option.valeur)}
              >
                {option.texte} {option.valeur === valeur && <Check size={14} aria-hidden="true" />}
              </button>
            </li>
          ))}
          {options.length === 0 && <li className="entete-filtre-vide">Aucun choix disponible.</li>}
        </ul>
      )}
    </div>
  );
}