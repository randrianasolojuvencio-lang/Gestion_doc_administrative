import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, GraduationCap, Users, LogOut, UserRound } from 'lucide-react';
import './MiseEnPage.css';

// Les pages du menu : adresse, texte et icône
const ELEMENTS_MENU = [
  { chemin: '/', libelle: 'Tableau de bord', Icone: LayoutDashboard },
  { chemin: '/demandes', libelle: 'Demandes', Icone: FileText },
  { chemin: '/etudiants', libelle: 'Étudiants', Icone: GraduationCap },
  { chemin: '/agents', libelle: 'Agents', Icone: Users },
];

// Cadre commun à toutes les pages connectées : menu à gauche, page à droite
export default function MiseEnPage({ agent, surDeconnexion }) {
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

        <div className="menu-utilisateur">
          <span className="menu-avatar"><UserRound size={18} aria-hidden="true" /></span>
          <div className="menu-identite">
            <strong>{agent.prenom_personnel} {agent.nom_personnel}</strong>
            <span>{agent.email_personnel}</span>
          </div>
          <button
            type="button"
            className="menu-deconnexion"
            onClick={surDeconnexion}
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut size={18} />
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