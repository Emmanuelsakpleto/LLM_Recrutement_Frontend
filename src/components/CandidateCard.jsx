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

  // Sécurisation de l'accès aux compétences, expérience et culture
  const competences = candidate.cv_analysis?.["Compétences"] || [];
  const experience = candidate.cv_analysis?.["Expérience"] || [];
  const culture = candidate.cv_analysis?.["Culture"] || [];

  // Mapping robuste des scores
  const predictiveScore = typeof candidate.predictive_score === 'number' && !isNaN(candidate.predictive_score)
    ? Number(candidate.predictive_score.toFixed(1))
    : null;
  const skillsScore = candidate.score_details?.skills_score !== undefined && candidate.score_details?.skills_score !== null
    ? Number(candidate.score_details.skills_score.toFixed(1))
    : 0;
  const experienceScore = candidate.score_details?.experience_score !== undefined && candidate.score_details?.experience_score !== null
    ? Number(candidate.score_details.experience_score.toFixed(1))
    : 0;
  const educationScore = candidate.score_details?.education_score !== undefined && candidate.score_details?.education_score !== null
    ? Number(candidate.score_details.education_score.toFixed(1))
    : 0;
  const finalScore = candidate.score_details?.final_score !== undefined && candidate.score_details?.final_score !== null
    ? Number(candidate.score_details.final_score.toFixed(1))
    : 0;

  // Affichage dynamique du score principal
  const displayScore = predictiveScore !== null && predictiveScore > 0 ? predictiveScore : finalScore;
  const scoreLabel = predictiveScore !== null && predictiveScore > 0 ? 'Score prédictif' : 'Score global';

  // Radar arrondi à 1 décimale
  const radarData = candidate.radar_data || {};
  const radarCompetences = radarData.Compétences !== undefined ? Number(Number(radarData.Compétences).toFixed(1)) : 0;
  const radarExperience = radarData.Expérience !== undefined ? Number(Number(radarData.Expérience).toFixed(1)) : 0;
  const radarCulture = radarData.Culture !== undefined ? Number(Number(radarData.Culture).toFixed(1)) : 0;

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
          <div className={`text-2xl font-bold ${getScoreColor(displayScore)}`}>
            {displayScore}%
          </div>
          <div className="text-xs text-gray-500">{scoreLabel}</div>
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
      </div>
    </Card>
  );
};

export default CandidateCard;
