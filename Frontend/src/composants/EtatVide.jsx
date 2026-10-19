import './EtatVide.css';

// Message affiché quand il n'y a encore rien à montrer (liste vide, page à venir)
export default function EtatVide({ Icone, titre, texte }) {
  return (
    <div className="etat-vide">
      <span className="etat-vide-icone"><Icone size={26} aria-hidden="true" /></span>
      <h3>{titre}</h3>
      <p>{texte}</p>
    </div>
  );
}