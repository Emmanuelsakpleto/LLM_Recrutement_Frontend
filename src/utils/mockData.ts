
// Ce fichier ne contient plus que les données pour les graphiques radar et les exemples
// Les vraies données viennent maintenant du backend via les services API

export const radarChartConfig = {
  type: 'radar',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true,
          color: '#e5e7eb'
        },
        suggestedMin: 0,
        suggestedMax: 100,
        pointLabels: {
          font: {
            size: 12,
            family: 'Inter'
          },
          color: '#374151'
        },
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2,
        borderColor: '#3b82f6'
      },
      point: {
        backgroundColor: '#3b82f6',
        borderColor: '#ffffff',
        borderWidth: 2,
        radius: 4
      }
    }
  }
};

// Configuration des appréciations pour l'évaluation
export const appreciationOptions = [
  { value: 1, label: 'Très insatisfait', color: 'text-red-600' },
  { value: 2, label: 'Insatisfait', color: 'text-red-500' },
  { value: 3, label: 'Satisfait', color: 'text-yellow-600' },
  { value: 4, label: 'Très satisfait', color: 'text-green-600' }
];

// Données d'exemple pour les tests (utilisées uniquement en développement)
export const exampleBriefData = {
  title: "Analyste de Données Senior",
  skills: ["Python", "SQL", "Power BI", "Analyse Statistique"],
  experience: "4-6 ans",
  description: "Nous recherchons un Analyste de Données Senior pour rejoindre notre équipe..."
};

export const exampleContextData = {
  values: ["Innovation", "Excellence", "Collaboration", "Transparence"],
  culture: "Nous valorisons l'innovation et encourageons la prise d'initiative..."
};
