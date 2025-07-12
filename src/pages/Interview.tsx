import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import ContextSelector, { CompanyContextType } from '../components/ContextSelector';
import { contextService, candidateService, companyContextService, JobBrief, Candidate, InterviewQuestion } from '../services/api';
import { useCompanyContext } from '../context/CompanyContext';

const Interview: React.FC = () => {
  const { companyContext } = useCompanyContext();
  const [contexts, setContexts] = useState<CompanyContextType[]>([]);
  const [briefs, setBriefs] = useState<JobBrief[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Charger dynamiquement les contextes d'entreprise
  const fetchContexts = async () => {
    const res = await companyContextService.getContexts();
    if (res.data) setContexts(res.data);
  };
  useEffect(() => {
    candidateService.getCandidates().then(res => {
      if (res.data) setCandidates(res.data);
    });
    // Charger les briefs si besoin
    import('../services/api').then(api => {
      api.jobService.getBriefs().then(res => {
        if (res.data) setBriefs(res.data);
      });
    });
    fetchContexts();
  }, []);

  useEffect(() => {
    if (selectedCandidateId) {
      const candidate = candidates.find(c => c.id === selectedCandidateId);
      if (candidate && candidate.interview_questions) {
        let qs: InterviewQuestion[] = [];
        if (typeof candidate.interview_questions === 'string') {
          try { 
            const parsed = JSON.parse(candidate.interview_questions);
            // Gérer les structures imbriquées
            if (parsed.questions && Array.isArray(parsed.questions)) {
              qs = parsed.questions;
            } else if (Array.isArray(parsed)) {
              qs = parsed;
            }
          } catch (e) {
            console.error('Erreur parsing questions candidat:', e);
          }
        } else if (Array.isArray(candidate.interview_questions)) {
          qs = candidate.interview_questions;
        } else if (typeof candidate.interview_questions === 'object' && candidate.interview_questions && 'questions' in candidate.interview_questions) {
          qs = (candidate.interview_questions as { questions: InterviewQuestion[] }).questions;
        }
        setQuestions(qs);
      } else {
        setQuestions([]);
      }
    } else {
      setQuestions([]);
    }
  }, [selectedCandidateId, candidates]);

  const handleGenerateQuestions = async () => {
    if (!selectedBriefId || !selectedCandidateId) {
      setToast({ message: 'Sélectionnez un brief et un candidat', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      const candidate = candidates.find(c => c.id === selectedCandidateId);
      const brief = briefs.find(b => b.id === selectedBriefId);
      if (!candidate || !brief) throw new Error('Brief ou candidat introuvable');
      
      // Appel backend pour générer les questions avec la nouvelle API
      const response = await candidateService.generateInterviewQuestions(candidate.id);
      
      console.log('🔍 Réponse génération questions:', response); // Debug
      console.log('🔍 response.data:', response.data); // Debug plus détaillé
      console.log('🔍 response.questions:', response.questions); // Debug structure directe
      
      // Extraction plus robuste des questions
      let questions = null;
      
      // Priorité 1: Les données sont directement dans response (pas dans response.data)
      if (response.questions?.questions && Array.isArray(response.questions.questions)) {
        questions = response.questions.questions;
      }
      // Priorité 2: Les données sont dans response.data (structure normale)
      else if (response.data?.questions?.questions && Array.isArray(response.data.questions.questions)) {
        questions = response.data.questions.questions;
      }
      // Priorité 3: Questions directement dans response.data.questions
      else if (response.data?.questions && Array.isArray(response.data.questions)) {
        questions = response.data.questions;
      }
      // Priorité 4: Questions directement dans response.questions (si c'est un array)
      else if (response.questions && Array.isArray(response.questions)) {
        questions = response.questions;
      }
      
      console.log('🔍 questions extraites finales:', questions); // Debug final
      
      if (questions && Array.isArray(questions)) {
        setQuestions(questions);
        setToast({ message: `✅ ${questions.length} questions générées !`, type: 'success' });
        
        // Recharger les candidats pour mettre à jour les données locales
        try {
          const candidatesResponse = await candidateService.getCandidates();
          if (candidatesResponse.data) {
            setCandidates(candidatesResponse.data);
          }
        } catch (e) {
          console.warn('Impossible de recharger les candidats:', e);
        }
      } else {
        console.error('❌ Impossible d\'extraire les questions');
        console.error('❌ Structure complète de response:', JSON.stringify(response, null, 2));
        setToast({ message: 'Impossible d\'extraire les questions de la réponse', type: 'error' });
      }
    } catch (e: unknown) {
      console.error('❌ Erreur génération questions:', e);
      const errorMessage = e instanceof Error ? e.message : 'Erreur inattendue';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour rafraîchir les questions existantes
  const refreshQuestions = async () => {
    if (!selectedCandidateId) {
      setToast({ message: 'Veuillez sélectionner un candidat d\'abord', type: 'error' });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await candidateService.getInterviewQuestions(selectedCandidateId);
      
      console.log('🔄 Réponse rafraîchissement questions:', response); // Debug
      
      // Même logique d'extraction que pour la génération
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
        setQuestions(questions);
        setToast({ message: `✅ ${questions.length} questions récupérées !`, type: 'success' });
      } else {
        console.error('❌ Aucune question trouvée:', response);
        setToast({ message: 'Aucune question trouvée pour ce candidat', type: 'error' });
      }
    } catch (error: unknown) {
      console.error('Erreur récupération questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de récupérer les questions';
      setToast({ message: `Erreur: ${errorMessage}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Questions d'entretien</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brief</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={selectedBriefId || ''}
              onChange={e => setSelectedBriefId(Number(e.target.value))}
            >
              <option value="">Sélectionnez un brief</option>
              {briefs.map(brief => (
                <option key={brief.id} value={brief.id}>{brief.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Candidat</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={selectedCandidateId || ''}
              onChange={e => setSelectedCandidateId(Number(e.target.value))}
            >
              <option value="">Sélectionnez un candidat</option>
              {candidates
                .filter(c => !selectedBriefId || c.brief_id === selectedBriefId)
                .map(candidate => (
                  <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4 mb-6">
          <Button variant="primary" onClick={handleGenerateQuestions} loading={isLoading} className="flex-1">
            Générer les questions
          </Button>
          <Button variant="secondary" onClick={refreshQuestions} loading={isLoading} className="flex-1">
            Rafraîchir les questions
          </Button>
        </div>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Questions générées</h2>
            {questions.length > 0 && selectedBriefId && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={refreshQuestions}
                  loading={isLoading}
                  disabled={!selectedCandidateId}
                >
                  🔄 Rafraîchir
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await contextService.copyQuestionsToClipboard(questions, briefs.find(b => b.id === selectedBriefId)?.title || "");
                    setToast({ message: 'Questions copiées dans le presse-papiers', type: 'success' });
                  }}
                >
                  Copier
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await contextService.exportQuestionsToPDF(questions, briefs.find(b => b.id === selectedBriefId)?.title || "");
                    setToast({ message: 'Export PDF lancé', type: 'success' });
                  }}
                >
                  Exporter PDF
                </Button>
              </div>
            )}
          </div>
          {questions.length > 0 ? (
            <div className="space-y-4 mt-6">
              {questions.map((q, i) => (
                <div key={i} className="p-4 bg-white rounded shadow">
                  <div className="font-bold text-blue-800 mb-1">
                    Question {i + 1} <span className="text-xs text-gray-500">({q.category})</span>
                  </div>
                  <div className="mb-1">{q.question}</div>
                  <div className="text-sm text-gray-600 italic">Objectif : {q.purpose}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 italic mb-4">Aucune question générée pour ce candidat.</p>
              {selectedCandidateId && (
                <Button
                  variant="outline"
                  onClick={refreshQuestions}
                  loading={isLoading}
                  className="mx-auto"
                >
                  🔄 Vérifier les questions existantes
                </Button>
              )}
            </div>
          )}
        </Card>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
};

export default Interview;
