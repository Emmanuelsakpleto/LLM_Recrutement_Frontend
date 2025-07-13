import React, { useState, useEffect } from 'react';
import RadarChartV2 from '../components/RadarChartV2';
import CandidateProcessManager from '../components/CandidateProcessManager';
import InterviewEvaluation from '../components/InterviewEvaluation';
import { candidateService } from '../services/api';

interface CandidateData {
  id: number;
  name: string;
  skills_score: number;
  experience_score: number;
  education_score: number;
  culture_score: number;
  interview_score: number;
  final_predictive_score: number;
  brief_id: number;
  status: string;
  process_stage: string;
}

interface ProcessDashboardProps {
  briefId: number;
  briefTitle: string;
}

const ProcessDashboard: React.FC<ProcessDashboardProps> = ({ briefId, briefTitle }) => {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'process' | 'radar' | 'evaluation'>('process');
  const [selectedCandidateForEvaluation, setSelectedCandidateForEvaluation] = useState<number | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);

  // Charger les candidats
  useEffect(() => {
    loadCandidates();
  }, [briefId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getCandidates();
      const filteredCandidates = response.data?.filter(
        (candidate: any) => candidate.brief_id === briefId
      ) || [];
      setCandidates(filteredCandidates);
    } catch (error) {
      console.error('Erreur chargement candidats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour le radar chart
  const radarData = candidates
    .filter(candidate => candidate.final_predictive_score > 0)
    .map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      scores: {
        skills: candidate.skills_score,
        experience: candidate.experience_score,
        education: candidate.education_score,
        culture: candidate.culture_score,
        interview: candidate.interview_score
      },
      final_predictive_score: candidate.final_predictive_score
    }));

  // Statistiques générales
  const stats = {
    total: candidates.length,
    cvAnalyzed: candidates.filter(c => c.process_stage === 'cv_analysis').length,
    questionsGenerated: candidates.filter(c => c.process_stage === 'interview_questions').length,
    interviewEvaluated: candidates.filter(c => c.process_stage === 'interview_evaluation').length,
    fullyEvaluated: candidates.filter(c => c.process_stage === 'final_evaluation').length,
    averageScore: radarData.length > 0 
      ? radarData.reduce((sum, c) => sum + c.final_predictive_score, 0) / radarData.length 
      : 0
  };

  const handleStageChange = (candidateId: number, newStage: string) => {
    loadCandidates(); // Recharger les données
  };

  const handleEvaluationComplete = async (evaluations: any[]) => {
    if (!selectedCandidateForEvaluation) return;

    try {
      const response = await fetch(`http://localhost:5000/api/candidates/${selectedCandidateForEvaluation}/evaluate-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ evaluations })
      });

      if (response.ok) {
        setSelectedCandidateForEvaluation(null);
        setSelectedView('process');
        await loadCandidates();
      }
    } catch (error) {
      console.error('Erreur évaluation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  // Vue d'évaluation
  if (selectedView === 'evaluation' && selectedCandidateForEvaluation && interviewQuestions.length > 0) {
    const candidate = candidates.find(c => c.id === selectedCandidateForEvaluation);
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <InterviewEvaluation
            candidateId={selectedCandidateForEvaluation}
            candidateName={candidate?.name || 'Candidat'}
            questions={interviewQuestions}
            onEvaluationComplete={handleEvaluationComplete}
            onCancel={() => {
              setSelectedView('process');
              setSelectedCandidateForEvaluation(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Recrutement</h1>
              <p className="text-gray-600 mt-1">Fiche de poste: {briefTitle}</p>
            </div>
            
            {/* Navigation */}
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedView('process')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedView === 'process'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Gestion Process
              </button>
              <button
                onClick={() => setSelectedView('radar')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedView === 'radar'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Comparaison Radar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Candidats</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.cvAnalyzed}</div>
            <div className="text-sm text-gray-600">CV Analysés</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.questionsGenerated}</div>
            <div className="text-sm text-gray-600">Questions Générées</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.interviewEvaluated}</div>
            <div className="text-sm text-gray-600">Entretiens Évalués</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.fullyEvaluated}</div>
            <div className="text-sm text-gray-600">Évaluations Complètes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.averageScore > 0 ? `${stats.averageScore.toFixed(1)}%` : '-'}
            </div>
            <div className="text-sm text-gray-600">Score Moyen</div>
          </div>
        </div>

        {/* Contenu principal */}
        {selectedView === 'process' && (
          <CandidateProcessManager
            briefId={briefId}
            onStageChange={handleStageChange}
          />
        )}

        {selectedView === 'radar' && (
          <div className="space-y-6">
            {radarData.length > 0 ? (
              <>
                <RadarChartV2 
                  candidates={radarData}
                  maxCandidates={5}
                  title="Comparaison des Candidats Évalués"
                />
                
                {/* Détails des candidats */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Détails des Candidats Évalués
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {radarData.map((candidate) => (
                      <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{candidate.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Compétences:</span>
                            <span className="font-medium">{candidate.scores.skills.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expérience:</span>
                            <span className="font-medium">{candidate.scores.experience.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Formation:</span>
                            <span className="font-medium">{candidate.scores.education.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Culture:</span>
                            <span className="font-medium">{candidate.scores.culture.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Entretien:</span>
                            <span className="font-medium">{candidate.scores.interview.toFixed(1)}%</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between font-semibold">
                            <span>Score Final:</span>
                            <span className="text-blue-600">{candidate.final_predictive_score.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Aucune Évaluation Complète
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Le radar de comparaison apparaîtra lorsque vous aurez finalisé l'évaluation d'au moins un candidat.
                  </p>
                  <button
                    onClick={() => setSelectedView('process')}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Commencer les Évaluations
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessDashboard;
