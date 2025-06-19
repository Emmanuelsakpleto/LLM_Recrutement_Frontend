
import React from 'react';
import Card from './Card';

const CandidateCard = ({ candidate, onClick, isSelected = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Recommandé':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'En évaluation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'À revoir':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card 
      hover={true} 
      onClick={onClick}
      className={`p-4 transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{candidate.name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
              {candidate.status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(candidate.predictive_score)}`}>
            {candidate.predictive_score}%
          </div>
          <div className="text-xs text-gray-500">Score prédictif</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Compétences:</span>
          <span className="font-medium">{candidate.radar_data.Compétences}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Expérience:</span>
          <span className="font-medium">{candidate.radar_data.Expérience}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Culture:</span>
          <span className="font-medium">{candidate.radar_data.Culture}%</span>
        </div>
      </div>

      {candidate.risks && candidate.risks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Risques identifiés:</div>
          <div className="text-xs text-red-600">
            {candidate.risks.slice(0, 2).join(', ')}
            {candidate.risks.length > 2 && '...'}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CandidateCard;
