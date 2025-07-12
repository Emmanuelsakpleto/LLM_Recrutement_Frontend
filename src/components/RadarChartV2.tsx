import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface CandidateScores {
  id: number;
  name: string;
  scores: {
    skills: number;
    experience: number;
    education: number;
    culture: number;
    interview: number;
  };
  final_predictive_score: number;
}

interface RadarChartV2Props {
  candidates: CandidateScores[];
  maxCandidates?: number;
  title?: string;
}

const RadarChartV2: React.FC<RadarChartV2Props> = ({ 
  candidates, 
  maxCandidates = 3,
  title = "Comparaison des Candidats" 
}) => {
  // Couleurs pour différencier les candidats
  const colors = [
    '#3b82f6', // Bleu
    '#ef4444', // Rouge
    '#10b981', // Vert
    '#f59e0b', // Orange
    '#8b5cf6', // Violet
  ];

  // Prendre seulement les meilleurs candidats
  const topCandidates = candidates
    .sort((a, b) => b.final_predictive_score - a.final_predictive_score)
    .slice(0, maxCandidates);

  // Préparer les données pour le radar
  const radarData = [
    {
      subject: 'Compétences',
      fullMark: 100,
      ...topCandidates.reduce((acc, candidate, index) => {
        acc[`candidate_${index}`] = candidate.scores.skills;
        return acc;
      }, {} as Record<string, number>)
    },
    {
      subject: 'Expérience',
      fullMark: 100,
      ...topCandidates.reduce((acc, candidate, index) => {
        acc[`candidate_${index}`] = candidate.scores.experience;
        return acc;
      }, {} as Record<string, number>)
    },
    {
      subject: 'Formation',
      fullMark: 100,
      ...topCandidates.reduce((acc, candidate, index) => {
        acc[`candidate_${index}`] = candidate.scores.education;
        return acc;
      }, {} as Record<string, number>)
    },
    {
      subject: 'Culture',
      fullMark: 100,
      ...topCandidates.reduce((acc, candidate, index) => {
        acc[`candidate_${index}`] = candidate.scores.culture;
        return acc;
      }, {} as Record<string, number>)
    },
    {
      subject: 'Entretien',
      fullMark: 100,
      ...topCandidates.reduce((acc, candidate, index) => {
        acc[`candidate_${index}`] = candidate.scores.interview;
        return acc;
      }, {} as Record<string, number>)
    }
  ];

  // Composant tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const candidateIndex = parseInt(entry.dataKey.split('_')[1]);
            const candidate = topCandidates[candidateIndex];
            return (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{candidate?.name}:</span>
                <span className="font-bold">{entry.value}%</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (topCandidates.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500">Aucun candidat avec scores complets disponible</p>
          <p className="text-sm text-gray-400 mt-1">
            Les candidats apparaîtront ici après l'évaluation complète
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">
          Comparaison des {topCandidates.length} meilleur{topCandidates.length > 1 ? 's' : ''} candidat{topCandidates.length > 1 ? 's' : ''} sur 5 dimensions
        </p>
      </div>

      {/* Graphique Radar */}
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Radar pour chaque candidat */}
            {topCandidates.map((candidate, index) => (
              <Radar
                key={candidate.id}
                name={candidate.name}
                dataKey={`candidate_${index}`}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{ r: 4, fill: colors[index % colors.length] }}
              />
            ))}
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry) => {
                const candidateIndex = parseInt(value.split('_')[1]);
                const candidate = topCandidates[candidateIndex];
                return (
                  <span style={{ color: entry.color, fontSize: '12px' }}>
                    {candidate?.name} ({candidate?.final_predictive_score.toFixed(1)}%)
                  </span>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Résumé des candidats */}
      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Résumé des Candidats</h4>
        {topCandidates.map((candidate, index) => {
          const color = colors[index % colors.length];
          const recommendation = candidate.final_predictive_score >= 80 
            ? 'Excellent' 
            : candidate.final_predictive_score >= 60 
            ? 'Bon candidat' 
            : 'À considérer';
          
          return (
            <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{candidate.name}</p>
                  <p className="text-xs text-gray-500">Rang #{index + 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {candidate.final_predictive_score.toFixed(1)}%
                </p>
                <p className={`text-xs ${
                  candidate.final_predictive_score >= 80 
                    ? 'text-green-600' 
                    : candidate.final_predictive_score >= 60 
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions rapides */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors">
          Exporter Comparaison
        </button>
        <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
          Générer Rapport
        </button>
        <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors">
          Planifier Entretiens
        </button>
      </div>
    </div>
  );
};

export default RadarChartV2;
