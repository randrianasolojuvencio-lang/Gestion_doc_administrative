import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FileText, GraduationCap, Users, LogOut, UserRound, ChevronUp, Database,
} from 'lucide-react';
import './MiseEnPage.css';

// Les pages du menu principal : adresse, texte et icône
// (la gestion des agents est rare : elle est dans le menu du profil)
const ELEMENTS_MENU = [
  { chemin: '/', libelle: 'Tableau de bord', Icone: LayoutDashboard },
  { chemin: '/demandes', libelle: 'Demandes', Icone: FileText },
  { chemin: '/etudiants', libelle: 'Étudiants', Icone: GraduationCap },
  { chemin: '/donnees-de-base', libelle: 'Données de base', Icone: Database },
];

// Cadre commun à toutes les pages connectées : menu à gauche, page à droite
export default function MiseEnPage({ agent, surDeconnexion }) {
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const zoneProfil = useRef(null);

  // Ferme le menu du profil quand on clique ailleurs ou qu'on appuie sur Échap
  useEffect(() => {
    function fermerSiClicDehors(evenement) {
      if (zoneProfil.current && !zoneProfil.current.contains(evenement.target)) {
        setMenuProfilOuvert(false);
      }
    }
    function fermerSiEchap(evenement) {
      if (evenement.key === 'Escape') setMenuProfilOuvert(false);
    }

    document.addEventListener('mousedown', fermerSiClicDehors);
    document.addEventListener('keydown', fermerSiEchap);
    return () => {
      document.removeEventListener('mousedown', fermerSiClicDehors);
      document.removeEventListener('keydown', fermerSiEchap);
    };
  }, []);

  return (
    <div className="mise-en-page">
      <aside className="menu-lateral">
        <div className="menu-marque">
          <span className="menu-logo"><GraduationCap size={20} aria-hidden="true" /></span>
          <div>
            <strong>ENI</strong>
            <small>Scolarité</small>
          </div>
        </div>

        <nav className="menu-navigation" aria-label="Navigation principale">
          {ELEMENTS_MENU.map(({ chemin, libelle, Icone }) => (
            <NavLink
              key={chemin}
              to={chemin}
              end={chemin === '/'}
              className={({ isActive }) => 'menu-lien' + (isActive ? ' actif' : '')}
            >
              <Icone size={18} aria-hidden="true" />
              <span>{libelle}</span>
            </NavLink>
          ))}
        </nav>

        {/* Profil de l'agent : un clic ouvre un petit menu discret */}
        <div className="menu-profil" ref={zoneProfil}>
          {menuProfilOuvert && (
            <div className="menu-profil-liste" role="menu">
              <NavLink
                to="/agents"
                className="menu-profil-element"
                role="menuitem"
                onClick={() => setMenuProfilOuvert(false)}
              >
                <Users size={16} aria-hidden="true" /> Gestion des agents
              </NavLink>
              <button
                type="button"
                className="menu-profil-element"
                role="menuitem"
                onClick={surDeconnexion}
              >
                <LogOut size={16} aria-hidden="true" /> Se déconnecter
              </button>
            </div>
          )}

          <button
            type="button"
            className="menu-utilisateur"
            onClick={() => setMenuProfilOuvert(!menuProfilOuvert)}
            aria-haspopup="menu"
            aria-expanded={menuProfilOuvert}
          >
            <span className="menu-avatar"><UserRound size={18} aria-hidden="true" /></span>
            <span className="menu-identite">
              <strong>{agent.prenom_personnel} {agent.nom_personnel}</strong>
              <span>{agent.email_personnel}</span>
            </span>
            <ChevronUp
              size={16}
              aria-hidden="true"
              className={menuProfilOuvert ? 'menu-fleche' : 'menu-fleche fermee'}
            />
          </button>
        </div>
      </aside>

      {/* Ici s'affiche la page choisie dans le menu */}
      <main className="zone-principale">
        <Outlet />
      </main>
    </div>
  );
}