import React, { useState, useEffect } from 'react';

interface Question {
  id: number;
  question: string;
  category: string;
  purpose: string;
}

interface InterviewEvaluationProps {
  candidateId: number;
  candidateName: string;
  questions: Question[];
  onEvaluationComplete: (evaluations: any[]) => void;
  onCancel: () => void;
}

const InterviewEvaluation: React.FC<InterviewEvaluationProps> = ({
  candidateId,
  candidateName,
  questions,
  onEvaluationComplete,
  onCancel
}) => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialiser les évaluations
  useEffect(() => {
    const initialEvaluations = questions.map(q => ({
      question: q.question,
      category: q.category,
      purpose: q.purpose,
      score: 0,
      appreciation: '',
      notes: ''
    }));
    setEvaluations(initialEvaluations);
  }, [questions]);

  const updateEvaluation = (index: number, field: string, value: any) => {
    const newEvaluations = [...evaluations];
    newEvaluations[index] = { ...newEvaluations[index], [field]: value };
    setEvaluations(newEvaluations);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onEvaluationComplete(evaluations);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 5: return 'Excellent';
      case 4: return 'Très bien';
      case 3: return 'Bien';
      case 2: return 'Moyen';
      case 1: return 'Faible';
      default: return 'Non évalué';
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentEvaluation = evaluations[currentQuestionIndex];

  if (!currentQuestion || !currentEvaluation) {
    return <div>Chargement...</div>;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Évaluation d'Entretien
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Candidat: <span className="font-medium">{candidateName}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question actuelle */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              {currentQuestion.category}
            </span>
            <span className="text-sm text-gray-500">
              {currentQuestion.purpose}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-lg text-gray-900 font-medium leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>
        </div>

        {/* Évaluation */}
        <div className="space-y-6">
          {/* Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Score de la réponse
            </label>
            <div className="flex space-x-3">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => updateEvaluation(currentQuestionIndex, 'score', score)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    currentEvaluation.score === score
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-xs mt-1">{getScoreLabel(score)}</div>
                  </div>
                </button>
              ))}
            </div>
            {currentEvaluation.score > 0 && (
              <div className="mt-2 text-center">
                <span className={`font-medium ${getScoreColor(currentEvaluation.score)}`}>
                  {getScoreLabel(currentEvaluation.score)}
                </span>
              </div>
            )}
          </div>

          {/* Appréciation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appréciation générale
            </label>
            <select
              value={currentEvaluation.appreciation}
              onChange={(e) => updateEvaluation(currentQuestionIndex, 'appreciation', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionnez une appréciation</option>
              <option value="Très satisfait">Très satisfait</option>
              <option value="Satisfait">Satisfait</option>
              <option value="Moyennement satisfait">Moyennement satisfait</option>
              <option value="Peu satisfait">Peu satisfait</option>
              <option value="Pas satisfait">Pas satisfait</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes et commentaires (optionnel)
            </label>
            <textarea
              value={currentEvaluation.notes}
              onChange={(e) => updateEvaluation(currentQuestionIndex, 'notes', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notez ici vos observations, points forts, axes d'amélioration..."
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Question Précédente
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                disabled={!currentEvaluation.score || !currentEvaluation.appreciation}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Question Suivante
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!currentEvaluation.score || !currentEvaluation.appreciation || loading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Finalisation...' : 'Terminer l\'Évaluation'}
              </button>
            )}
          </div>
        </div>

        {/* Résumé des évaluations */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Résumé des évaluations</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {evaluations.map((evaluation, index) => (
              <div
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  index === currentQuestionIndex
                    ? 'border-blue-500 bg-blue-50'
                    : evaluation.score > 0
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="text-xs text-gray-600 truncate">
                  Q{index + 1}: {questions[index]?.category}
                </div>
                <div className="text-sm font-medium">
                  {evaluation.score > 0 ? `${evaluation.score}/5` : 'Non évalué'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewEvaluation;
