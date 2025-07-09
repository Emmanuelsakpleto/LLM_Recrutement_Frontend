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
          try { qs = JSON.parse(candidate.interview_questions); } catch {}
        } else if (Array.isArray(candidate.interview_questions)) {
          qs = candidate.interview_questions;
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
      // Appel backend pour générer les questions
      const response = await contextService.createContext({
        values: brief.skills,
        culture: brief.description,
        brief_id: brief.id,
        candidate_id: candidate.id
      });
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
        setToast({ message: `${response.data.questions.length} questions générées !`, type: 'success' });
      } else {
        setToast({ message: response.error || 'Erreur lors de la génération', type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: e.message || 'Erreur inattendue', type: 'error' });
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
        <Button variant="primary" onClick={handleGenerateQuestions} loading={isLoading} className="mb-6">
          Générer les questions
        </Button>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h2 className="text-xl font-semibold">Questions générées</h2>
            {questions.length > 0 && selectedBriefId && (
              <div className="flex gap-2">
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
            <p className="text-gray-500 italic">Aucune question générée pour ce candidat.</p>
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
