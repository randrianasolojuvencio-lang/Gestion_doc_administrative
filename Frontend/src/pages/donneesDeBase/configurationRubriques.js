import { UserCog, Layers, GitBranch, GraduationCap, Users, CalendarDays, Tag } from 'lucide-react';

// Règles de saisie communes
const MOTIF_CODE = /^[A-Z0-9]+$/;
const MESSAGE_CODE = 'Lettres majuscules et chiffres uniquement.';
const MOTIF_NOM = /^\p{L}[\p{L} \-'’]*$/u;
const MESSAGE_NOM = 'Lettres, espaces, tirets et apostrophes uniquement.';

// Champ "code" : saisi en majuscules, non modifiable après l'enregistrement
const champCode = (nom, longueurMax, exemple) => ({
  nom, libelle: 'Code', requis: true, longueurMax, majuscules: true, estCode: true,
  motif: MOTIF_CODE, messageMotif: MESSAGE_CODE, exemple,
});

// Les rubriques, dans l'ordre où il faut les remplir.
// Pour chaque rubrique : les champs du formulaire, les colonnes du tableau,
// et les autres rubriques dont elle a besoin pour ses listes de choix.
export const RUBRIQUES = [
  {
    cle: 'administration',
    titre: 'Administration',
    Icone: UserCog,
    cleCode: 'matricule_responsable',
    description: 'Responsables de mention et directeur : ils signent les documents.',
    dependances: [],
    champs: [
      {
        nom: 'matricule_responsable', libelle: 'Matricule', requis: true, longueurMax: 8,
        majuscules: true, estCode: true, motif: /^[A-Z0-9 -]+$/,
        messageMotif: 'Lettres majuscules, chiffres, espaces et tirets.',
      },
      { nom: 'nom_responsable', libelle: 'Nom', requis: true, longueurMax: 50, majuscules: true, motif: MOTIF_NOM, messageMotif: MESSAGE_NOM },
      { nom: 'prenom_responsable', libelle: 'Prénom', longueurMax: 50, motif: MOTIF_NOM, messageMotif: MESSAGE_NOM },
      { nom: 'fonction', libelle: 'Fonction', requis: true, type: 'choix', options: ['Responsable de mention', 'Directeur'] },
    ],
    colonnes: [
      { libelle: 'Matricule', valeur: (l) => l.matricule_responsable },
      { libelle: 'Nom', valeur: (l) => `${l.nom_responsable} ${l.prenom_responsable ?? ''}` },
      { libelle: 'Fonction', valeur: (l) => l.fonction },
    ],
  },
  {
    cle: 'mentions',
    titre: 'Mentions',
    Icone: Layers,
    cleCode: 'code_mention',
    description: 'Chaque mention a un responsable (rubrique Administration).',
    dependances: ['administration'],
    champs: [
      champCode('code_mention', 4, 'INFO'),
      { nom: 'libelle_mention', libelle: 'Libellé', requis: true, longueurMax: 30, exemple: 'Informatique' },
      {
        nom: 'matricule_responsable', libelle: 'Responsable', requis: true, type: 'choix',
        source: 'administration', cleValeur: 'matricule_responsable',
        texte: (a) => `${a.nom_responsable} ${a.prenom_responsable ?? ''} (${a.fonction})`,
      },
    ],
    colonnes: [
      { libelle: 'Code', valeur: (l) => l.code_mention },
      { libelle: 'Libellé', valeur: (l) => l.libelle_mention },
      { libelle: 'Responsable', valeur: (l) => (l.responsable ? `${l.responsable.nom_responsable} ${l.responsable.prenom_responsable ?? ''}` : l.matricule_responsable) },
    ],
  },
  {
    cle: 'parcours',
    titre: 'Parcours',
    Icone: GitBranch,
    cleCode: 'code_parcour',
    description: 'Chaque parcours appartient à une mention.',
    dependances: ['mentions'],
    champs: [
      champCode('code_parcour', 6, 'GL'),
      { nom: 'libelle_parcour', libelle: 'Libellé', requis: true, longueurMax: 70, exemple: 'Génie Logiciel' },
      {
        nom: 'code_mention', libelle: 'Mention', requis: true, type: 'choix',
        source: 'mentions', cleValeur: 'code_mention', texte: (m) => m.libelle_mention,
      },
    ],
    colonnes: [
      { libelle: 'Code', valeur: (l) => l.code_parcour },
      { libelle: 'Libellé', valeur: (l) => l.libelle_parcour },
      { libelle: 'Mention', valeur: (l) => l.mention?.libelle_mention ?? l.code_mention },
    ],
  },
  {
    cle: 'niveaux',
    titre: 'Niveaux',
    Icone: GraduationCap,
    cleCode: 'code_niveau',
    description: 'Niveaux d\'étude : Licence 1, Licence 2…',
    dependances: [],
    champs: [
      champCode('code_niveau', 4, 'L1'),
      { nom: 'libelle_niveau', libelle: 'Libellé', requis: true, longueurMax: 10, exemple: 'Licence 1' },
    ],
    colonnes: [
      { libelle: 'Code', valeur: (l) => l.code_niveau },
      { libelle: 'Libellé', valeur: (l) => l.libelle_niveau },
    ],
  },
  {
    cle: 'groupes',
    titre: 'Groupes',
    Icone: Users,
    cleCode: 'code_groupe',
    description: 'Groupes de travaux dirigés.',
    dependances: [],
    champs: [
      champCode('code_groupe', 4, 'G1'),
      { nom: 'libelle_groupe', libelle: 'Libellé', requis: true, longueurMax: 10, exemple: 'Groupe 1' },
    ],
    colonnes: [
      { libelle: 'Code', valeur: (l) => l.code_groupe },
      { libelle: 'Libellé', valeur: (l) => l.libelle_groupe },
    ],
  },
  {
    cle: 'annees',
    titre: 'Années universitaires',
    Icone: CalendarDays,
    cleCode: 'code_annee_universitaire',
    description: 'À ajouter chaque année : le code est de la forme 2025-2026.',
    dependances: [],
    champs: [
      {
        nom: 'code_annee_universitaire', libelle: 'Code', requis: true, longueurMax: 9, estCode: true,
        motif: /^\d{4}-\d{4}$/, messageMotif: 'Format AAAA-AAAA (exemple : 2025-2026).',
        exemple: '2025-2026',
        controle: (v) => (Number(v.slice(5)) === Number(v.slice(0, 4)) + 1 ? '' : 'La deuxième année doit suivre la première.'),
      },
      { nom: 'libelle_annee_universitaire', libelle: 'Libellé', requis: true, longueurMax: 30, exemple: 'Année universitaire 2025-2026' },
    ],
    colonnes: [
      { libelle: 'Code', valeur: (l) => l.code_annee_universitaire },
      { libelle: 'Libellé', valeur: (l) => l.libelle_annee_universitaire },
    ],
  },
  {
    cle: 'statuts-inscription',
    titre: 'Statuts d\'inscription',
    Icone: Tag,
    cleCode: 'code_statut_inscription',
    description: 'Nouveau, Redoublant, Réinscrit.',
    dependances: [],
    champs: [
      champCode('code_statut_inscription', 4, 'NOUV'),
      { nom: 'libelle_statut_inscription', libelle: 'Libellé', requis: true, longueurMax: 15, exemple: 'Nouveau' },
    ],
    colonnes: [
      { libelle: 'Code', valeur: (l) => l.code_statut_inscription },
      { libelle: 'Libellé', valeur: (l) => l.libelle_statut_inscription },
    ],
  },
];