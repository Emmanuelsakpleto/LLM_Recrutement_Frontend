import React, { useState, useEffect } from 'react';
import { candidateService, InterviewQuestion, Candidate } from '../services/api';

interface CandidateProcessStage {
  id: number;
  name: string;
  status: string;
  process_stage: string;
  brief_id: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  culture_score: number;
  interview_score: number;
  final_predictive_score: number;
  interview_questions?: InterviewQuestion[];
}

interface CandidateProcessManagerProps {
  briefId: number;
  onStageChange?: (candidateId: number, newStage: string) => void;
}

const CandidateProcessManager: React.FC<CandidateProcessManagerProps> = ({ 
  briefId, 
  onStageChange 
}) => {
  const [candidates, setCandidates] = useState<CandidateProcessStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [evaluations, setEvaluations] = useState<unknown[]>([]);

  // Charger les candidats
  useEffect(() => {
    loadCandidates();
  }, [briefId]);

  const loadCandidates = async () => {
    try {
      const response = await candidateService.getCandidates();
      const filteredCandidates = response.data?.filter(
        (candidate: Candidate) => candidate.brief_id === briefId
      ) || [];
      setCandidates(filteredCandidates);
    } catch (error) {
      console.error('Erreur chargement candidats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer questions d'entretien
  const generateInterviewQuestions = async (candidateId: number) => {
    try {
      setLoading(true);
      const response = await candidateService.generateInterviewQuestions(candidateId);
      
      console.log('Réponse génération questions:', response); // Debug
      
      // Les questions sont dans response.data.questions.questions
      const questions = response.data?.questions?.questions || response.data?.questions;
      
      if (questions && Array.isArray(questions)) {
        setInterviewQuestions(questions);
        setSelectedCandidate(candidateId);
        await loadCandidates(); // Recharger pour mettre à jour le statut
        onStageChange?.(candidateId, 'interview_questions');
        alert(`✅ ${questions.length} questions générées avec succès !`);
      } else {
        console.error('Données manquantes dans la réponse:', response);
        alert(`❌ Erreur: ${response.error || 'Structure de données inattendue'}`);
      }
    } catch (error: unknown) {
      console.error('Erreur génération questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`❌ Erreur génération questions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les questions existantes
  const viewInterviewQuestions = async (candidateId: number) => {
    try {
      setLoading(true);
      const response = await candidateService.getInterviewQuestions(candidateId);
      
      console.log('Réponse récupération questions:', response); // Debug
      
      // Même logique d'extraction que dans Interview.tsx
      let questions = null;
      
      // Priorité 1: Les données sont directement dans response
      if (response.questions?.questions && Array.isArray(response.questions.questions)) {
        questions = response.questions.questions;
      }
      // Priorité 2: Les données sont dans response.data
      else if (response.data?.questions?.questions && Array.isArray(response.data.questions.questions)) {
        questions = response.data.questions.questions;
      }
      // Priorité 3: Questions directement dans response.data.questions
      else if (response.data?.questions && Array.isArray(response.data.questions)) {
        questions = response.data.questions;
      }
      // Priorité 4: Questions directement dans response.questions
      else if (response.questions && Array.isArray(response.questions)) {
        questions = response.questions;
      }
      
      if (questions && Array.isArray(questions)) {
        setInterviewQuestions(questions);
        setSelectedCandidate(candidateId);
        alert(`✅ ${questions.length} questions récupérées !`);
      } else {
        console.error('Aucune question trouvée pour ce candidat:', response);
        alert('❌ Aucune question trouvée pour ce candidat');
      }
    } catch (error: unknown) {
      console.error('Erreur récupération questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`❌ Erreur récupération questions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Évaluer entretien
  const evaluateInterview = async (candidateId: number, evaluationData: unknown[]) => {
    try {
      setLoading(true);
      const response = await candidateService.evaluateInterview(candidateId, evaluationData);
      
      if (response.data) {
        await loadCandidates();
        onStageChange?.(candidateId, 'interview_evaluation');
      }
    } catch (error) {
      console.error('Erreur évaluation entretien:', error);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer candidat
  const deleteCandidate = async (candidateId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce candidat ? Cette action est irréversible.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await candidateService.deleteCandidate(candidateId);
      
      if (response.data) {
        await loadCandidates(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur suppression candidat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Finaliser évaluation
  const finalizeEvaluation = async (candidateId: number) => {
    try {
      setLoading(true);
      const response = await candidateService.finalizeEvaluation(candidateId);
      
      if (response.data) {
        await loadCandidates();
        onStageChange?.(candidateId, 'final_evaluation');
      }
    } catch (error) {
      console.error('Erreur finalisation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Composant pour les étapes
  const ProcessStepIndicator = ({ stage, status }: { stage: string; status: string }) => {
    const getStageInfo = (stage: string) => {
      switch (stage) {
        case 'cv_analysis':
          return { icon: '📄', label: 'CV Analysé', color: 'bg-blue-100 text-blue-700' };
        case 'interview_questions':
          return { icon: '❓', label: 'Questions Générées', color: 'bg-yellow-100 text-yellow-700' };
        case 'interview_evaluation':
          return { icon: '✅', label: 'Entretien Évalué', color: 'bg-green-100 text-green-700' };
        case 'final_evaluation':
          return { icon: '🏆', label: 'Évaluation Complète', color: 'bg-purple-100 text-purple-700' };
        default:
          return { icon: '⏳', label: 'En attente', color: 'bg-gray-100 text-gray-700' };
      }
    };

    const stageInfo = getStageInfo(stage);
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stageInfo.color}`}>
        <span className="mr-2">{stageInfo.icon}</span>
        {stageInfo.label}
      </div>
    );
  };

  // Composant pour les actions
  const CandidateActions = ({ candidate }: { candidate: CandidateProcessStage }) => {
    const canGenerateQuestions = candidate.process_stage === 'cv_analysis';
    const canViewQuestions = ['interview_questions', 'interview_evaluation', 'final_evaluation'].includes(candidate.process_stage);
    const canEvaluate = candidate.process_stage === 'interview_questions';
    const canFinalize = candidate.process_stage === 'interview_evaluation';

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          {canGenerateQuestions && (
            <button
              onClick={() => generateInterviewQuestions(candidate.id)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              disabled={loading}
            >
              Générer Questions
            </button>
          )}
          {canViewQuestions && (
            <button
              onClick={() => viewInterviewQuestions(candidate.id)}
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
              disabled={loading}
            >
              📝 Voir Questions
            </button>
          )}
          {canEvaluate && (
            <button
              onClick={() => setSelectedCandidate(candidate.id)}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            >
              Évaluer Entretien
            </button>
          )}
          {canFinalize && (
            <button
              onClick={() => finalizeEvaluation(candidate.id)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              disabled={loading}
            >
              Finaliser Évaluation
            </button>
          )}
        </div>
        
        {/* Actions secondaires */}
        <div className="flex space-x-2">
          <button
            onClick={() => deleteCandidate(candidate.id)}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
            disabled={loading}
            title="Supprimer ce candidat"
          >
            🗑️ Supprimer
          </button>
          <button
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
            title="Exporter le rapport"
          >
            📄 Export
          </button>
        </div>
      </div>
    );
  };

  // Composant pour les scores
  const ScoreDisplay = ({ candidate }: { candidate: CandidateProcessStage }) => {
    const scores = [
      { label: 'Compétences', value: candidate.skills_score, color: 'bg-blue-200' },
      { label: 'Expérience', value: candidate.experience_score, color: 'bg-green-200' },
      { label: 'Formation', value: candidate.education_score, color: 'bg-purple-200' },
      { label: 'Culture', value: candidate.culture_score, color: 'bg-yellow-200' },
      { label: 'Entretien', value: candidate.interview_score, color: 'bg-red-200' }
    ];

    return (
      <div className="grid grid-cols-5 gap-2 mt-3">
        {scores.map((score, index) => (
          <div key={index} className="text-center">
            <div className={`${score.color} rounded-lg p-2`}>
              <div className="text-xs font-medium text-gray-700">{score.label}</div>
              <div className="text-lg font-bold text-gray-900">
                {score.value > 0 ? `${score.value.toFixed(1)}%` : '-'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Composant pour afficher les questions d'entretien
  const InterviewQuestionsDisplay = () => {
    if (!selectedCandidate || interviewQuestions.length === 0) return null;

    const candidate = candidates.find(c => c.id === selectedCandidate);
    
    return (
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-blue-900">
            📝 Questions d'entretien - {candidate?.name}
          </h4>
          <button
            onClick={() => {
              setSelectedCandidate(null);
              setInterviewQuestions([]);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            ✕ Fermer
          </button>
        </div>
        
        <div className="space-y-3">
          {interviewQuestions.map((question, index) => (
            <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-start space-x-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm font-semibold rounded-full flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{typeof question === 'string' ? question : question.question}</p>
                  {question.category && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {question.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            📄 Exporter Questions
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            ✅ Commencer Évaluation
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des candidats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Gestion des Candidats - Process de Recrutement
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Suivez l'avancement de chaque candidat à travers les étapes d'évaluation
        </p>
      </div>

      <div className="p-6">
        {candidates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">👤</div>
            <p className="text-gray-500">Aucun candidat pour cette fiche de poste</p>
            <p className="text-sm text-gray-400 mt-1">
              Uploadez des CV pour commencer le processus d'évaluation
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{candidate.name}</h4>
                      <ProcessStepIndicator stage={candidate.process_stage} status={candidate.status} />
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      Status: {candidate.status}
                    </div>

                    {candidate.final_predictive_score > 0 && (
                      <div className="mt-2">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          <span className="mr-2">🎯</span>
                          Score Final: {candidate.final_predictive_score.toFixed(1)}%
                        </div>
                      </div>
                    )}

                    <ScoreDisplay candidate={candidate} />
                  </div>
                  
                  <CandidateActions candidate={candidate} />
                </div>
              </div>
            ))}
          </div>
        )}

        <InterviewQuestionsDisplay />
      </div>
    </div>
  );
};

export default CandidateProcessManager;
