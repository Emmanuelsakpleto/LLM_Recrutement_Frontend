
export const briefsData = [
  {
    id: "JB-2025-001",
    title: "Développeur Full-Stack Senior",
    skills: ["React", "Node.js", "MongoDB", "TypeScript"],
    experience: "5+ ans",
    description: "Nous recherchons un développeur full-stack expérimenté pour rejoindre notre équipe technique et développer des applications web innovantes.",
    created_at: "2025-01-10T10:00:00Z"
  },
  {
    id: "JB-2025-002", 
    title: "Analyste de Données Senior",
    skills: ["Python", "SQL", "Power BI", "Analyse Statistique"],
    experience: "4-6 ans",
    description: "Nous recherchons un Analyste de Données Senior pour transformer des données brutes en insights exploitables.",
    created_at: "2025-01-12T14:30:00Z"
  },
  {
    id: "JB-2025-003",
    title: "Designer UX/UI",
    skills: ["Figma", "Adobe Creative Suite", "Prototypage", "User Research"],
    experience: "3-5 ans", 
    description: "Rejoignez notre équipe design pour créer des expériences utilisateur exceptionnelles et des interfaces intuitives.",
    created_at: "2025-01-15T09:15:00Z"
  }
];

export const candidatesData = [
  {
    id: 1,
    name: "Marie Leclerc",
    brief_id: "JB-2025-001",
    predictive_score: 85.5,
    status: "Évalué",
    email: "marie.leclerc@email.com",
    radar_data: {
      'Compétences': 80,
      'Expérience': 90,
      'Formation': 70,
      'Culture': 85,
      'Entretien': 75
    },
    skills: ["React", "Node.js", "JavaScript", "MongoDB"],
    experience: "6 ans d'expérience en développement web",
    education: "Master en Informatique",
    scores: {
      skills: 85,
      experience: 90,
      education: 75
    },
    risks: ["Manque d'expérience en TypeScript"],
    recommendations: ["Formation TypeScript en 2 semaines", "Mentorat sur les bonnes pratiques"]
  },
  {
    id: 2,
    name: "Jean Dupont",
    brief_id: "JB-2025-001",
    predictive_score: 72.3,
    status: "En évaluation",
    email: "jean.dupont@email.com",
    radar_data: {
      'Compétences': 70,
      'Expérience': 65,
      'Formation': 80,
      'Culture': 75,
      'Entretien': 71
    },
    skills: ["React", "JavaScript", "CSS"],
    experience: "3 ans d'expérience en frontend",
    education: "Licence en Informatique",
    scores: {
      skills: 70,
      experience: 65,
      education: 80
    },
    risks: ["Expérience backend limitée", "Connaissance MongoDB à approfondir"],
    recommendations: ["Formation Node.js intensive", "Projet pratique MongoDB"]
  },
  {
    id: 3,
    name: "Sophie Martin",
    brief_id: "JB-2025-002",
    predictive_score: 88.7,
    status: "Recommandé",
    email: "sophie.martin@email.com",
    radar_data: {
      'Compétences': 90,
      'Expérience': 85,
      'Formation': 95,
      'Culture': 80,
      'Entretien': 88
    },
    skills: ["Python", "SQL", "Tableau", "Machine Learning"],
    experience: "5 ans d'expérience en analyse de données",
    education: "Master en Statistiques",
    scores: {
      skills: 90,
      experience: 85,
      education: 95
    },
    risks: ["Aucun risque majeur identifié"],
    recommendations: ["Onboarding standard", "Intégration équipe data"]
  },
  {
    id: 4,
    name: "Lucas Bernard",
    brief_id: "JB-2025-003",
    predictive_score: 79.2,
    status: "À revoir",
    email: "lucas.bernard@email.com",
    radar_data: {
      'Compétences': 85,
      'Expérience': 70,
      'Formation': 75,
      'Culture': 80,
      'Entretien': 76
    },
    skills: ["Figma", "Adobe XD", "Sketch", "Prototyping"],
    experience: "3 ans d'expérience en design UX/UI",
    education: "Master en Design Numérique",
    scores: {
      skills: 85,
      experience: 70,
      education: 75
    },
    risks: ["Manque d'expérience en recherche utilisateur"],
    recommendations: ["Formation User Research", "Mentorat avec Senior UX"]
  }
];

export const questionsMock = {
  questions: [
    {question: "Décrivez votre expérience avec les technologies mentionnées dans l'offre.", category: "Job Description", purpose: "Compétences techniques"},
    {question: "Comment gérez-vous les projets complexes ?", category: "Job Description", purpose: "Gestion de projet"},
    {question: "Quelle est votre approche pour résoudre des problèmes techniques ?", category: "Job Description", purpose: "Problem solving"},
    {question: "Décrivez votre expérience avec le travail en équipe technique.", category: "Job Description", purpose: "Collaboration technique"},
    {question: "Comment restez-vous à jour avec les nouvelles technologies ?", category: "Job Description", purpose: "Apprentissage continu"},
    
    {question: "Comment définissez-vous l'innovation dans votre travail ?", category: "Company Culture", purpose: "Innovation"},
    {question: "Parlez-nous d'un projet où vous avez fait preuve d'excellence.", category: "Company Culture", purpose: "Excellence"},
    {question: "Comment collaborez-vous efficacement avec vos collègues ?", category: "Company Culture", purpose: "Collaboration"},
    {question: "Comment gérez-vous les changements dans l'organisation ?", category: "Company Culture", purpose: "Adaptabilité"},
    {question: "Que signifie la transparence pour vous en entreprise ?", category: "Company Culture", purpose: "Transparence"},
    
    {question: "Quelles sont vos principales réalisations professionnelles ?", category: "CV/Professional Life", purpose: "Expérience"},
    {question: "Pourquoi avez-vous choisi cette spécialisation ?", category: "CV/Professional Life", purpose: "Motivation"},
    {question: "Décrivez votre parcours de formation.", category: "CV/Professional Life", purpose: "Formation"},
    {question: "Quels sont vos objectifs de carrière à long terme ?", category: "CV/Professional Life", purpose: "Ambitions"},
    {question: "Comment évaluez-vous votre progression professionnelle ?", category: "CV/Professional Life", purpose: "Auto-évaluation"}
  ]
};

export const contextData = {
  values: "Innovation, Excellence, Collaboration, Transparence",
  culture: "TechNova favorise un environnement de travail collaboratif et innovant où chaque employé peut s'épanouir et contribuer à notre mission d'excellence technologique."
};
