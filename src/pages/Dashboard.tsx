
import React, { useState, useEffect } from 'react';
import CandidateCard from '../components/CandidateCard';
import RadarChart from '../components/RadarChart';
import Card from '../components/Card';
import Button from '../components/Button';
import BriefSelector from '../components/BriefSelector';
import { candidateService, JobBrief, Candidate } from '../services/api';

interface DashboardProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  briefs: JobBrief[];
  setBriefs: (briefs: JobBrief[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  activeBrief, 
  onBriefChange, 
  candidates, 
  setCandidates,
  briefs,
  setBriefs 
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filter, setFilter] = useState('all');

  // Sélectionner le premier candidat par défaut
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidates, selectedCandidate]);

  const filteredCandidates = candidates.filter(candidate => {
    if (filter === 'all') return true;
    if (filter === 'recommended') return candidate.status === 'Recommandé';
    if (filter === 'review') return candidate.status === 'À revoir';
    if (filter === 'evaluation') return candidate.status === 'En évaluation';
    return true;
  });

  // Créer des données radar basées sur les données réelles du candidat
  const createRadarData = (candidate: Candidate) => {
    if (!candidate.cv_analysis) return {};
    
    return {
      'Compétences': candidate.cv_analysis.score || 75,
      'Expérience': Math.min(candidate.cv_analysis.experience?.length * 20 || 60, 100),
      'Formation': Math.min(candidate.cv_analysis.education?.length * 25 || 70, 100),
      'Culture': candidate.predictive_score || 80,
      'Entretien': candidate.appreciations?.length > 0 
        ? candidate.appreciations.reduce((acc, app) => acc + app.score, 0) / candidate.appreciations.length * 25
        : 0
    };
  };

  // Générer des risques et recommandations basés sur les données réelles
  const generateRisksAndRecommendations = (candidate: Candidate) => {
    const risks = [];
    const recommendations = [];

    if (candidate.predictive_score < 70) {
      risks.push('Score prédictif en dessous du seuil recommandé');
      recommendations.push('Organiser un entretien complémentaire technique');
    }

    if (!candidate.cv_analysis?.competences || candidate.cv_analysis.competences.length < 3) {
      risks.push('Nombre de compétences techniques limité');
      recommendations.push('Formation technique complémentaire requise');
    }

    if (candidate.appreciations?.length === 0) {
      risks.push('Aucune évaluation d\'entretien disponible');
      recommendations.push('Finaliser l\'évaluation d\'entretien');
    }

    return { risks, recommendations };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard RH</h1>
          <p className="text-gray-600">Gestion du processus de recrutement TechNova</p>
        </div>

        <BriefSelector
          activeBrief={activeBrief}
          onBriefChange={onBriefChange}
          briefs={briefs}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Candidats</p>
                <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Recommandés</p>
                <p className="text-2xl font-bold text-green-600">
                  {candidates.filter(c => c.status === 'Recommandé').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">En Évaluation</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {candidates.filter(c => c.status === 'En évaluation').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">À Revoir</p>
                <p className="text-2xl font-bold text-red-600">
                  {candidates.filter(c => c.status === 'À revoir').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidates List */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidats</h2>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={filter === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={filter === 'recommended' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('recommended')}
                >
                  Recommandés
                </Button>
                <Button
                  variant={filter === 'evaluation' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('evaluation')}
                >
                  En évaluation
                </Button>
                <Button
                  variant={filter === 'review' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('review')}
                >
                  À revoir
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onClick={() => setSelectedCandidate(candidate)}
                    isSelected={selectedCandidate?.id === candidate.id}
                  />
                ))
              ) : (
                <Card className="p-6 text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun candidat</h3>
                  <p className="text-gray-600">Téléchargez des CV pour voir les candidats ici</p>
                </Card>
              )}
            </div>
          </div>

          {/* Candidate Details */}
          <div className="lg:col-span-2">
            {selectedCandidate ? (
              <div className="space-y-6">
                {/* Header */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                      <p className="text-gray-600">
                        Score prédictif: <span className="font-semibold text-blue-600">{selectedCandidate.predictive_score}%</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCandidate.status === 'Recommandé' ? 'bg-green-100 text-green-800' :
                      selectedCandidate.status === 'En évaluation' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedCandidate.status}
                    </span>
                  </div>
                </Card>

                {/* Radar Chart */}
                <RadarChart 
                  data={createRadarData(selectedCandidate)} 
                  title="Profil de Compétences"
                />

                {/* Risks & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risks */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Risques Identifiés
                    </h3>
                    <div className="space-y-2">
                      {generateRisksAndRecommendations(selectedCandidate).risks.map((risk, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Recommendations */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">💡</span>
                      Recommandations
                    </h3>
                    <div className="space-y-2">
                      {generateRisksAndRecommendations(selectedCandidate).recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Valider le candidat</Button>
                    <Button variant="secondary">Replanifier entretien</Button>
                    <Button variant="outline">Exporter le rapport</Button>
                    <Button variant="ghost">Ajouter des notes</Button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un candidat</h3>
                <p className="text-gray-600">Choisissez un candidat dans la liste pour voir ses détails</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
