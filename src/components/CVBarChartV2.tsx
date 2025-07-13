import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ScoreData {
  skills_score: number;
  experience_score: number;
  education_score: number;
  culture_score?: number;
  interview_score?: number;
}

interface CVBarChartV2Props {
  scores: ScoreData;
  candidateName: string;
  showAllScores?: boolean;
}

const CVBarChartV2: React.FC<CVBarChartV2Props> = ({ 
  scores, 
  candidateName, 
  showAllScores = false 
}) => {
  // Préparer les données pour le graphique
  const data = [
    {
      name: 'Compétences',
      score: Math.round(scores.skills_score || 0),
      color: '#3b82f6' // Bleu
    },
    {
      name: 'Expérience',
      score: Math.round(scores.experience_score || 0),
      color: '#10b981' // Vert
    },
    {
      name: 'Formation',
      score: Math.round(scores.education_score || 0),
      color: '#f59e0b' // Jaune/Orange
    }
  ];

  // Ajouter les scores culture et entretien si disponibles et demandés
  if (showAllScores) {
    data.push(
      {
        name: 'Culture',
        score: Math.round(scores.culture_score || 0),
        color: '#ef4444' // Rouge
      },
      {
        name: 'Entretien',
        score: Math.round(scores.interview_score || 0),
        color: '#8b5cf6' // Violet
      }
    );
  }

  // Composant tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm" style={{ color: data.color }}>
            Score: <span className="font-bold">{data.value}%</span>
          </p>
          <div className="mt-1">
            <div 
              className="h-2 rounded-full bg-gray-200"
              style={{ width: '60px' }}
            >
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(data.value / 100) * 60}px`,
                  backgroundColor: data.color 
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Déterminer la couleur de la barre en fonction du score
  const getBarColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // Vert - Excellent
    if (score >= 60) return '#f59e0b'; // Orange - Bon
    if (score >= 40) return '#ef4444'; // Rouge - Moyen
    return '#6b7280'; // Gris - Faible
  };

  const averageScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analyse des Scores - {candidateName}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {showAllScores ? '5 dimensions évaluées' : '3 dimensions évaluées (CV)'}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Score moyen:</span>
            <span 
              className={`px-2 py-1 rounded-full text-sm font-medium ${
                averageScore >= 80 
                  ? 'bg-green-100 text-green-800' 
                  : averageScore >= 60 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {Math.round(averageScore)}%
            </span>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="score" 
              radius={[4, 4, 0, 0]}
              name="Score (%)"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.score)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Légende des couleurs */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Excellent (80%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>Bon (60-79%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>Moyen (40-59%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-gray-500"></div>
          <span>Faible (&lt;40%)</span>
        </div>
      </div>

      {/* Recommandations rapides */}
      {!showAllScores && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Prochaine étape:</strong> Générer les questions d'entretien pour évaluer l'adéquation culturelle et les compétences comportementales.
          </p>
        </div>
      )}
    </div>
  );
};

export default CVBarChartV2;
