import { useState } from 'react';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, LogIn,
  LoaderCircle, CircleAlert, ShieldCheck, Info,
} from 'lucide-react';
import { seConnecter } from '../services/serviceApi';

// Page de connexion des agents de la scolarité
export default function PageConnexion({ surConnexion }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [aideAffichee, setAideAffichee] = useState(false);

  // Envoie l'e-mail et le mot de passe au serveur
  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur('');
    setEnCours(true);
    try {
      const agent = await seConnecter(email, motDePasse);
      surConnexion(agent);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="page-connexion">
      {/* Bandeau du haut : nom de l'école et du portail */}
      <header className="connexion-entete">
        <div className="connexion-marque">
          <span className="connexion-logo"><GraduationCap size={22} aria-hidden="true" /></span>
          <div>
            <strong>ENI</strong>
            <div className="connexion-nom-ecole">École Nationale d'Informatique</div>
          </div>
        </div>
        <span className="connexion-portail">Portail de la scolarité</span>
      </header>

      <main className="connexion-principal">
        <form className="connexion-carte" onSubmit={soumettre}>
          <h1>Connexion</h1>
          <p className="connexion-intro">Accès réservé aux agents de la scolarité.</p>

          <label htmlFor="champ-email">E-mail professionnel</label>
          <div className="champ">
            <Mail size={18} className="champ-icone" aria-hidden="true" />
            <input
              id="champ-email"
              type="email"
              autoComplete="username"
              placeholder="prenom.nom@eni.mg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <label htmlFor="champ-mot-de-passe">Mot de passe</label>
          <div className="champ">
            <Lock size={18} className="champ-icone" aria-hidden="true" />
            <input
              id="champ-mot-de-passe"
              type={motDePasseVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Saisissez votre mot de passe"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
            {/* Bouton œil : affiche ou cache le mot de passe */}
            <button
              type="button"
              className="champ-bouton"
              onClick={() => setMotDePasseVisible(!motDePasseVisible)}
              aria-label={motDePasseVisible ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
            >
              {motDePasseVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="connexion-options">
            <button
              type="button"
              className="lien"
              onClick={() => setAideAffichee(!aideAffichee)}
              aria-expanded={aideAffichee}
            >
              Mot de passe oublié ?
            </button>
          </div>

          {aideAffichee && (
            <div className="connexion-aide">
              <Info size={18} aria-hidden="true" />
              <span>
                Demandez à un collègue de la scolarité : il peut vous donner un nouveau
                mot de passe provisoire depuis la page « Agents ».
              </span>
            </div>
          )}

          {erreur && (
            <div className="connexion-erreur" role="alert">
              <CircleAlert size={18} aria-hidden="true" />
              <span>{erreur}</span>
            </div>
          )}

          <button className="connexion-valider" disabled={enCours}>
            {enCours ? (
              <><LoaderCircle size={18} className="tourner" aria-hidden="true" /> Connexion…</>
            ) : (
              <><LogIn size={18} aria-hidden="true" /> Se connecter</>
            )}
          </button>

          <p className="connexion-securite">
            <ShieldCheck size={16} aria-hidden="true" /> Accès sécurisé, réservé au personnel habilité.
          </p>
        </form>
      </main>

      <footer className="connexion-pied">
        © {new Date().getFullYear()} École Nationale d'Informatique de Fianarantsoa
      </footer>
    </div>
  );
}