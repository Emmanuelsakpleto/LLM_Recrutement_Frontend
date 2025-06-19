
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import RadarChart from '../components/RadarChart';
import BriefSelector from '../components/BriefSelector';
import { evaluationService, contextService, JobBrief, Candidate, InterviewQuestion } from '../services/api';

interface EvaluationProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  briefs: JobBrief[];
  setBriefs: (briefs: JobBrief[]) => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface EvaluationResult {
  predictive_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  radar_data: Record<string, number>;
  total_questions: number;
  answered_questions: number;
  average_score: number;
}

const Evaluation: React.FC<EvaluationProps> = ({ 
  activeBrief, 
  onBriefChange, 
  candidates, 
  setCandidates,
  briefs,
  setBriefs 
}) => {
  const [appreciations, setAppreciations] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Charger les questions d'entretien
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await contextService.getQuestions();
        if (response.data) {
          setQuestions(response.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des questions:', error);
      }
    };

    loadQuestions();
  }, []);

  // Sélectionner le premier candidat par défaut
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidates, selectedCandidate]);

  const appreciationOptions = [
    { value: 1, label: 'Très insatisfait', color: 'text-red-600' },
    { value: 2, label: 'Insatisfait', color: 'text-red-500' },
    { value: 3, label: 'Satisfait', color: 'text-yellow-600' },
    { value: 4, label: 'Très satisfait', color: 'text-green-600' }
  ];

  const handleAppreciationChange = (questionIndex: number, value: string) => {
    setAppreciations(prev => ({
      ...prev,
      [questionIndex]: parseInt(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      setToast({ message: 'Aucun candidat sélectionné', type: 'error' });
      return;
    }

    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(appreciations).length;
    
    if (answeredQuestions < totalQuestions) {
      setToast({ 
        message: `Veuillez répondre à toutes les questions (${answeredQuestions}/${totalQuestions})`, 
        type: 'error' 
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Préparer les données d'évaluation
      const evaluationData = {
        appreciations: questions.map((question, index) => ({
          question: question.question,
          category: question.category,
          appreciation: getAppreciationLabel(appreciations[index]),
          score: appreciations[index]
        }))
      };

      const response = await evaluationService.submitEvaluation(selectedCandidate.id, evaluationData);
      
      if (response.data) {
        // Calculer les données radar basées sur les appréciations
        const radarData = {
          'Compétences': calculateCategoryScore('Job Description') * 25,
          'Expérience': Math.random() * 30 + 70,
          'Formation': Math.random() * 20 + 80,
          'Culture': calculateCategoryScore('Company Culture') * 25,
          'Entretien': Object.values(appreciations).reduce((a, b) => a + b, 0) / Object.values(appreciations).length * 25
        };
        
        setEvaluationResult({
          ...response.data.analysis,
          radar_data: radarData,
          total_questions: totalQuestions,
          answered_questions: answeredQuestions,
          average_score: Object.values(appreciations).reduce((a, b) => a + b, 0) / Object.values(appreciations).length
        });
        
        setToast({ message: 'Évaluation soumise avec succès !', type: 'success' });
        
        // Mettre à jour le candidat dans la liste
        setCandidates(prev => prev.map(c => 
          c.id === selectedCandidate.id 
            ? { ...c, status: 'Évalué', predictive_score: response.data.analysis.predictive_score }
            : c
        ));
      } else {
        setToast({ message: response.error || 'Erreur lors de la soumission', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setToast({ message: 'Erreur lors de la soumission', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateCategoryScore = (category: string): number => {
    const categoryQuestions = questions
      .map((q, index) => ({ ...q, index }))
      .filter(q => q.category === category);
    
    const categoryScores = categoryQuestions
      .filter(q => appreciations[q.index])
      .map(q => appreciations[q.index]);
    
    return categoryScores.length > 0 ? 
      categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length : 0;
  };

  const getAppreciationLabel = (value: number): string => {
    const option = appreciationOptions.find(opt => opt.value === value);
    return option ? option.label : '';
  };

  const getProgressPercentage = (): number => {
    const answered = Object.keys(appreciations).length;
    const total = questions.length;
    return total > 0 ? (answered / total) * 100 : 0;
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'Job Description': return '💼';
      case 'Company Culture': return '🏢';
      case 'CV/Professional Life': return '👤';
      default: return '❓';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Job Description': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Company Culture': return 'bg-green-100 text-green-800 border-green-200';
      case 'CV/Professional Life': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Évaluation de l'Entretien</h1>
          <p className="text-gray-600">Évaluez les réponses du candidat pour générer un rapport prédictif</p>
        </div>

        <BriefSelector
          activeBrief={activeBrief}
          onBriefChange={onBriefChange}
          briefs={briefs}
        />

        {/* Sélection du candidat */}
        {candidates.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="fas fa-user text-blue-600 text-lg"></i>
                <h3 className="text-lg font-semibold text-gray-900">Candidat à Évaluer</h3>
              </div>
              
              <select
                value={selectedCandidate?.id || ''}
                onChange={(e) => {
                  const candidate = candidates.find(c => c.id === parseInt(e.target.value));
                  setSelectedCandidate(candidate || null);
                  setAppreciations({}); // Reset appreciations when changing candidate
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un candidat...</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} (ID: {candidate.id})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedCandidate && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">{selectedCandidate.name}</h4>
                <p className="text-sm text-blue-700 mb-2">Status: {selectedCandidate.status}</p>
                <p className="text-sm text-blue-700">Score prédictif: {selectedCandidate.predictive_score}%</p>
              </div>
            )}
          </Card>
        )}

        {!evaluationResult ? (
          <div className="space-y-6">
            {questions.length > 0 ? (
              <>
                {/* Progress */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Progression</h2>
                    <span className="text-sm text-gray-600">
                      {Object.keys(appreciations).length}/{questions.length} questions
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{width: `${getProgressPercentage()}%`}}
                    ></div>
                  </div>
                </Card>

                {/* Questions Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {questions.map((question, index) => (
                      <Card key={index} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Question {index + 1}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getCategoryColor(question.category)}`}>
                                  <span>{getCategoryIcon(question.category)}</span>
                                  <span>{question.category}</span>
                                </span>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {question.question}
                              </h3>
                              {question.purpose && (
                                <p className="text-sm text-gray-600 mb-4">Objectif: {question.purpose}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {appreciationOptions.map((option) => (
                              <label
                                key={option.value}
                                className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  appreciations[index] === option.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option.value}
                                  checked={appreciations[index] === option.value}
                                  onChange={(e) => handleAppreciationChange(index, e.target.value)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  appreciations[index] === option.value
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}>
                                  {appreciations[index] === option.value && (
                                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                  )}
                                </div>
                                <span className={`text-sm font-medium ${option.color}`}>
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 shadow-lg">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Progression: {Object.keys(appreciations).length}/{questions.length} questions
                      </div>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        size="lg" 
                        loading={isSubmitting}
                        disabled={Object.keys(appreciations).length < questions.length || !selectedCandidate}
                      >
                        {isSubmitting ? 'Génération du rapport...' : 'Générer le Rapport'}
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-6xl mb-4">❓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune question disponible</h3>
                <p className="text-gray-600">Générez d'abord des questions dans la section Contexte</p>
              </Card>
            )}
          </div>
        ) : (
          /* Evaluation Results */
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Rapport d'Évaluation</h2>
                <div className="flex space-x-3">
                  <Button variant="secondary" onClick={() => setEvaluationResult(null)}>
                    Modifier l'évaluation
                  </Button>
                  <Button variant="primary">Télécharger PDF</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {evaluationResult.predictive_score}%
                  </div>
                  <div className="text-sm text-gray-600">Score Prédictif</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {evaluationResult.answered_questions}
                  </div>
                  <div className="text-sm text-gray-600">Questions Évaluées</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {evaluationResult.average_score.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Note Moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {evaluationResult.recommendations.length}
                  </div>
                  <div className="text-sm text-gray-600">Recommandations</div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <RadarChart 
                data={evaluationResult.radar_data} 
                title="Profil de Performance"
              />

              {/* Recommendations & Risks */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💪</span>
                    Points Forts
                  </h3>
                  <div className="space-y-2">
                    {evaluationResult.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Points d'Amélioration
                  </h3>
                  <div className="space-y-2">
                    {evaluationResult.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💡</span>
                    Recommandations d'Onboarding
                  </h3>
                  <div className="space-y-2">
                    {evaluationResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions de Suivi</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Valider le candidat</Button>
                <Button variant="secondary">Programmer 2nd entretien</Button>
                <Button variant="outline">Partager avec l'équipe</Button>
                <Button variant="ghost">Archiver l'évaluation</Button>
              </div>
            </Card>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Evaluation;
