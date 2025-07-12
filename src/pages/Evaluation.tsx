import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import RadarChart from '../components/RadarChart';
import BriefSelector from '../components/BriefSelector';
import ContextSelector, { CompanyContextType } from '../components/ContextSelector';
import { candidateService, contextService, JobBrief, Candidate, InterviewQuestion, companyContextService } from '../services/api';
import { useCompanyContext } from '../context/CompanyContext';
import { useNavigate } from 'react-router-dom';

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
  risks: string[];
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
  const { companyContext } = useCompanyContext();
  const navigate = useNavigate();

  const [appreciations, setAppreciations] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [contexts, setContexts] = useState<CompanyContextType[]>([]);

  // Sélectionner le premier candidat par défaut
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidates, selectedCandidate]);

  // Met à jour les questions à chaque changement de candidat sélectionné
  useEffect(() => {
    if (selectedCandidate) {
      // Essayer d'abord d'extraire les questions des données du candidat
      if (selectedCandidate.interview_questions) {
        let q: unknown = selectedCandidate.interview_questions;
        
        if (typeof q === 'string') {
          try {
            q = JSON.parse(q);
          } catch (e) {
            console.error('❌ Error parsing JSON questions:', e);
            setToast({ message: "Format des questions invalide (JSON)", type: 'error' });
            setQuestions([]);
            return;
          }
        }
        
        // Logique robuste d'extraction des questions avec priorité
        let extractedQuestions: InterviewQuestion[] = [];
        
        // Priorité 1: Directement un tableau
        if (Array.isArray(q)) {
          extractedQuestions = q;
        }
        // Priorité 2: q.questions.questions (structure imbriquée)
        else if (q && typeof q === 'object' && 'questions' in q && q.questions && typeof q.questions === 'object' && 'questions' in q.questions && Array.isArray(q.questions.questions)) {
          extractedQuestions = q.questions.questions;
        }
        // Priorité 3: q.questions (structure simple)
        else if (q && typeof q === 'object' && 'questions' in q && Array.isArray(q.questions)) {
          extractedQuestions = q.questions;
        }
        // Priorité 4: q.data.questions
        else if (q && typeof q === 'object' && 'data' in q && q.data && typeof q.data === 'object' && 'questions' in q.data && Array.isArray(q.data.questions)) {
          extractedQuestions = q.data.questions;
        }
        // Priorité 5: q.data.questions.questions
        else if (q && typeof q === 'object' && 'data' in q && q.data && typeof q.data === 'object' && 'questions' in q.data && q.data.questions && typeof q.data.questions === 'object' && 'questions' in q.data.questions && Array.isArray(q.data.questions.questions)) {
          extractedQuestions = q.data.questions.questions;
        }
        
        if (extractedQuestions.length > 0) {
          console.log('✅ Questions loaded from candidate data:', extractedQuestions.length);
          setQuestions(extractedQuestions);
        } else {
          console.log('⚠️ No questions found in candidate data, trying API call...');
          // Si on ne trouve pas les questions dans les données du candidat, essayer l'API
          loadInterviewQuestions(selectedCandidate.id);
        }
      } else {
        console.log('ℹ️ No interview_questions in candidate, trying API call...');
        // Essayer de charger les questions via l'API spécifique
        loadInterviewQuestions(selectedCandidate.id);
      }
    } else {
      setQuestions([]);
    }
  }, [selectedCandidate]);

  // Charger dynamiquement les contextes d'entreprise
  const fetchContexts = async () => {
    const res = await companyContextService.getContexts();
    if (res.data) setContexts(res.data);
  };
  useEffect(() => {
    fetchContexts();
  }, []);

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

    if (questions.length === 0) {
       setToast({ message: "Aucune question d'évaluation disponible.", type: 'error' });
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
        evaluations: questions.map((question, index) => ({
          question: question.question,
          category: question.category,
          appreciation: getAppreciationLabel(appreciations[index]),
          score: appreciations[index]
        }))
      };

      const response = await candidateService.submitEvaluation(selectedCandidate.id, evaluationData);
      if (response.data) {
        // La nouvelle API retourne directement les données analysées
        const analysisData = response.data;
        setEvaluationResult({
          predictive_score: analysisData.predictive_score || analysisData.final_predictive_score,
          risks: Array.isArray(analysisData.risks) ? analysisData.risks : [],
          recommendations: Array.isArray(analysisData.recommendations) ? analysisData.recommendations : [],
          radar_data: analysisData.radar_data || {},
          total_questions: totalQuestions,
          answered_questions: answeredQuestions,
          average_score: Object.values(appreciations).reduce((a, b) => a + b, 0) / Object.values(appreciations).length,
          strengths: ["Évaluation complétée avec succès"],
          weaknesses: []
        });
        setToast({ message: 'Évaluation soumise avec succès !', type: 'success' });
        
        // Mettre à jour le candidat dans la liste
        setCandidates(prev => prev.map(c => 
          c.id === selectedCandidate.id 
            ? {
                ...c,
                status: 'Évaluation complète',
                predictive_score: analysisData.predictive_score || analysisData.final_predictive_score,
                radar_data: analysisData.radar_data || c.radar_data,
                risks: analysisData.risks || c.risks,
                recommendations: analysisData.recommendations || c.recommendations,
                appreciations: evaluationData.evaluations // Les appréciations qu'on vient de soumettre
              }
            : c
        ));
        
        // Rafraîchir la liste complète avec parsing
        candidateService.getCandidates().then(res => {
          if (res.data) {
            const parsedCandidates = res.data.map((candidate: any) => {
              try {
                return {
                  ...candidate,
                  radar_data: typeof candidate.radar_data === 'string' 
                    ? JSON.parse(candidate.radar_data) 
                    : candidate.radar_data,
                  risks: typeof candidate.risks === 'string' 
                    ? JSON.parse(candidate.risks) 
                    : candidate.risks,
                  recommendations: typeof candidate.recommendations === 'string' 
                    ? JSON.parse(candidate.recommendations) 
                    : candidate.recommendations
                };
              } catch (e) {
                return candidate;
              }
            });
            setCandidates(parsedCandidates);
          }
        });
      } else if (response.error) {
        setToast({ message: response.error, type: 'error' });
      } else {
        setToast({ message: 'Erreur lors de la soumission ou réponse inattendue du backend.', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setToast({ message: 'Erreur lors de la soumission', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export PDF du rapport d'évaluation
  const handleExportPDF = async () => {
    if (!evaluationResult || !selectedCandidate) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text(`Rapport d'Évaluation - ${selectedCandidate.name}`, 10, 15);
    doc.setFontSize(12);
    doc.text(`Score prédictif : ${evaluationResult.predictive_score}%`, 10, 30);
    doc.text(`Note moyenne : ${evaluationResult.average_score.toFixed(1)}`, 10, 38);
    doc.text(`Questions évaluées : ${evaluationResult.answered_questions}/${evaluationResult.total_questions}`, 10, 46);
    doc.text('Points forts :', 10, 58);
    let y = 66;
    evaluationResult.strengths.forEach((s: string) => {
      doc.text(`- ${s}`, 12, y);
      y += 8;
    });
    y += 4;
    doc.text('Points d’amélioration :', 10, y);
    y += 8;
    evaluationResult.weaknesses.forEach((w: string) => {
      doc.text(`- ${w}`, 12, y);
      y += 8;
    });
    y += 4;
    doc.text('Recommandations :', 10, y);
    y += 8;
    evaluationResult.recommendations.forEach((r: string) => {
      doc.text(`- ${r}`, 12, y);
      y += 8;
    });
    // Signature en bas de page (bleu, icône cravate, TheRecruit)
    doc.setFontSize(10);
    doc.setTextColor(59, 130, 246); // Bleu
    doc.text('👔 TheRecruit', 10, 285);
    doc.setTextColor(0, 0, 0);
    doc.save(`Rapport_Evaluation_${selectedCandidate.name}.pdf`);
  };

  const getAppreciationLabel = (value: number): string => {
    const option = appreciationOptions.find(opt => opt.value === value);
    return option ? option.label : '';
  };

  const getProgressPercentage = (): number => {
    const answered = Object.keys(appreciations).length;
    const total = questions.length; // Use questions state
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

  // Fonction pour recharger les candidats depuis la base de données
  const refreshCandidates = async () => {
    try {
      console.log('🔄 Refreshing candidates from database...');
      const response = await candidateService.getCandidates();
      if (response.data) {
        setCandidates(response.data);
        
        // Mettre à jour le candidat sélectionné avec les nouvelles données
        if (selectedCandidate) {
          const updatedCandidate = response.data.find(c => c.id === selectedCandidate.id);
          if (updatedCandidate) {
            setSelectedCandidate(updatedCandidate);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing candidates:', error);
      setToast({ message: 'Erreur lors du rechargement des candidats', type: 'error' });
    }
  };

  // Recharger les candidats au montage du composant
  useEffect(() => {
    refreshCandidates();
  }, []);

  // Fonction pour récupérer les questions d'entretien d'un candidat spécifique
  const loadInterviewQuestions = async (candidateId: number) => {
    try {
      console.log('� Loading interview questions for candidate:', candidateId);
      const response = await candidateService.getInterviewQuestions(candidateId);
      console.log('📦 Full API response:', response);
      
      // Utiliser la même logique d'extraction que dans Interview.tsx
      let questions = null;
      
      // Priorité 1: response.questions.questions (structure observée dans les logs)
      if (response.questions?.questions && Array.isArray(response.questions.questions)) {
        questions = response.questions.questions;
        console.log('✅ Found questions in response.questions.questions');
      }
      // Priorité 2: Les données sont dans response.data (structure normale)
      else if (response.data?.questions?.questions && Array.isArray(response.data.questions.questions)) {
        questions = response.data.questions.questions;
        console.log('✅ Found questions in response.data.questions.questions');
      }
      // Priorité 3: Questions directement dans response.data.questions
      else if (response.data?.questions && Array.isArray(response.data.questions)) {
        questions = response.data.questions;
        console.log('✅ Found questions in response.data.questions');
      }
      // Priorité 4: Questions directement dans response.questions (si c'est un array)
      else if (response.questions && Array.isArray(response.questions)) {
        questions = response.questions;
        console.log('✅ Found questions in response.questions');
      }
      // Priorité 5: Données directement dans response.data si c'est un array
      else if (response.data && Array.isArray(response.data)) {
        questions = response.data;
        console.log('✅ Found questions in response.data');
      }
      
      if (questions && Array.isArray(questions) && questions.length > 0) {
        console.log('✅ Questions loaded from API:', questions.length);
        setQuestions(questions);
        return true;
      }
      
      console.log('❌ No questions found in API response');
      console.log('🔍 Response structure:', {
        hasData: !!response.data,
        hasQuestions: !!response.questions,
        dataType: typeof response.data,
        questionsType: typeof response.questions
      });
      return false;
    } catch (error) {
      console.error('❌ Error loading interview questions:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Sélecteur de contexte d'entreprise en tout premier */}
        <ContextSelector contexts={contexts} onContextsChange={fetchContexts} />
        {/* Affichage du contexte actif juste après */}
        {companyContext && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-900 rounded border border-blue-200 text-sm">
            <strong>Contexte actif :</strong> {companyContext.nom_entreprise} | {companyContext.domaine} <br />
            <span className="text-xs text-blue-700">Valeurs : {companyContext.values?.join(', ')}</span><br />
            <span className="text-xs text-blue-700">Culture : {companyContext.culture}</span>
          </div>
        )}
        {/* Avertissement si aucun contexte sélectionné */}
        {!companyContext && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 text-sm">
            ⚠️ Aucun contexte d'entreprise sélectionné. Certaines fonctionnalités peuvent être limitées.
          </div>
        )}
        {/* Header */}
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
        {candidates.filter(c => activeBrief && c.brief_id === activeBrief.id).length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="fas fa-user text-blue-600 text-lg"></i>
                <h3 className="text-lg font-semibold text-gray-900">Candidat à Évaluer</h3>
              </div>
              
              <div className="flex items-center space-x-2">
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
                  {candidates.filter(c => activeBrief && c.brief_id === activeBrief.id).map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} (ID: {candidate.id})
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={refreshCandidates}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Recharger les candidats"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
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
            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
              <div className="flex items-start space-x-2">
                <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                <div>
                  <strong>Candidat sélectionné:</strong> {selectedCandidate?.name || 'Aucun'}<br/>
                  <strong>Questions d'entretien:</strong> {questions.length > 0 ? `${questions.length} questions chargées` : 'Aucune question trouvée'}<br/>
                  {!selectedCandidate?.interview_questions && selectedCandidate && (
                    <div className="mt-2 p-2 bg-yellow-100 text-yellow-700 rounded">
                      ⚠️ Ce candidat n'a pas de questions d'entretien. Allez d'abord sur la page "Entretien" pour générer les questions.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
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
                                <div className={
                                  `w-4 h-4 rounded-full border-2 ${appreciations[index] === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`
                                }>
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
                  <Button variant="primary" onClick={handleExportPDF}>
                    Télécharger PDF
                  </Button>
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
                data={evaluationResult.radar_data ? [{ 
                  name: selectedCandidate?.name || 'Candidat', 
                  values: evaluationResult.radar_data, 
                  color: '#3b82f6' 
                }] : []} 
                title="Profil de Performance"
                axes={['Compétences', 'Expérience', 'Formation', 'Culture', 'Entretien']}
                polygon={true}
              />

              {/* Recommendations & Risks */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💪</span>
                    Points Forts
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(evaluationResult?.strengths) && evaluationResult.strengths.length > 0 ? (
                      evaluationResult.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{strength}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Aucun point fort identifié</span>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Points d'Amélioration
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(evaluationResult?.weaknesses) && evaluationResult.weaknesses.length > 0 ? (
                      evaluationResult.weaknesses.map((weakness, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{weakness}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Aucun point d'amélioration identifié</span>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💡</span>
                    Recommandations d'Onboarding
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(evaluationResult?.recommendations) && evaluationResult.recommendations.length > 0 ? (
                      evaluationResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Aucune recommandation disponible</span>
                    )}
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
