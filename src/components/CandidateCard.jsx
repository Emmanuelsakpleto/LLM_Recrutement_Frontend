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

  // Fonction pour normaliser un score (gérer les cas 0-1 et 0-100)
  const normalizeScore = (score) => {
    if (score === null || score === undefined || isNaN(score)) return 0;
    // Si le score est entre 0 et 1, on le convertit en pourcentage
    if (score <= 1) return Number((score * 100).toFixed(1));
    // Si le score est déjà en pourcentage (0-100), on le garde tel quel
    return Number(score.toFixed(1));
  };

  // Mapping robuste des 5 scores - avec fallback sur score_details si pas disponible directement
  const skillsScore = candidate.skills_score !== undefined && candidate.skills_score !== null
    ? normalizeScore(candidate.skills_score)
    : (candidate.score_details?.skills_score !== undefined ? normalizeScore(candidate.score_details.skills_score) : 0);
    
  const experienceScore = candidate.experience_score !== undefined && candidate.experience_score !== null
    ? normalizeScore(candidate.experience_score)
    : (candidate.score_details?.experience_score !== undefined ? normalizeScore(candidate.score_details.experience_score) : 0);
    
  const educationScore = candidate.education_score !== undefined && candidate.education_score !== null
    ? normalizeScore(candidate.education_score)
    : (candidate.score_details?.education_score !== undefined ? normalizeScore(candidate.score_details.education_score) : 0);
    
  const cultureScore = candidate.culture_score !== undefined && candidate.culture_score !== null
    ? normalizeScore(candidate.culture_score)
    : (candidate.radar_data?.Culture !== undefined ? normalizeScore(candidate.radar_data.Culture) : 0);
    
  const interviewScore = candidate.interview_score !== undefined && candidate.interview_score !== null
    ? normalizeScore(candidate.interview_score)
    : (candidate.radar_data?.Entretien !== undefined ? normalizeScore(candidate.radar_data.Entretien) : 0);

  return (
    <Card 
      hover={true} 
      onClick={onClick}
      className={`p-4 transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
    >
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{candidate.name}</h3>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
            {candidate.status}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Compétences:</span>
          <span className="font-medium">{skillsScore}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Expérience:</span>
          <span className="font-medium">{experienceScore}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Formation:</span>
          <span className="font-medium">{educationScore}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Culture:</span>
          <span className="font-medium">{cultureScore}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Entretien:</span>
          <span className="font-medium">{interviewScore}%</span>
        </div>
      </div>
    </Card>
  );
};

export default CandidateCard;
