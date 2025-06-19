
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import BriefSelector from '../components/BriefSelector';
import { contextService, JobBrief, InterviewQuestion } from '../services/api';

interface ContextProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  briefs: JobBrief[];
  setBriefs: (briefs: JobBrief[]) => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const Context: React.FC<ContextProps> = ({ activeBrief, onBriefChange, briefs, setBriefs }) => {
  const [formData, setFormData] = useState({
    values: '',
    culture: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<InterviewQuestion[] | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.values || !formData.culture) {
      setToast({ message: 'Tous les champs sont requis', type: 'error' });
      return;
    }

    setIsGenerating(true);
    
    try {
      const valuesArray = formData.values.split(',').map(value => value.trim()).filter(value => value);
      
      const response = await contextService.createContext({
        values: valuesArray,
        culture: formData.culture
      });

      if (response.data) {
        setGeneratedQuestions(response.data.questions);
        setToast({ message: `${response.data.questions.length} questions générées avec succès !`, type: 'success' });
      } else {
        setToast({ message: response.error || 'Erreur lors de la génération', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      setToast({ message: 'Erreur lors de la génération', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const valuesArray = formData.values.split(',').map(value => value.trim()).filter(value => value);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contexte de l'Entreprise</h1>
          <p className="text-gray-600">Définissez la culture et les valeurs pour générer des questions d'entretien adaptées</p>
        </div>

        <BriefSelector
          activeBrief={activeBrief}
          onBriefChange={onBriefChange}
          briefs={briefs}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations Culturelles</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="values" className="block text-sm font-medium text-gray-700 mb-2">
                    Valeurs de l'Entreprise *
                  </label>
                  <textarea
                    id="values"
                    name="values"
                    value={formData.values}
                    onChange={handleInputChange}
                    placeholder="ex: Innovation, Excellence, Collaboration, Transparence (séparées par des virgules)"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {valuesArray.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {valuesArray.map((value, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="culture" className="block text-sm font-medium text-gray-700 mb-2">
                    Description de la Culture *
                  </label>
                  <textarea
                    id="culture"
                    name="culture"
                    value={formData.culture}
                    onChange={handleInputChange}
                    placeholder="Décrivez l'environnement de travail, les méthodes de collaboration, l'autonomie accordée aux employés..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  loading={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Génération en cours...' : 'Générer les Questions'}
                </Button>
              </form>
            </Card>

            {/* Preview */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Aperçu du Contexte</h2>
              
              {formData.values || formData.culture ? (
                <div className="space-y-4">
                  {valuesArray.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Valeurs :</span>
                      <div className="flex flex-wrap gap-2">
                        {valuesArray.map((value, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.culture && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Culture :</span>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                        {formData.culture}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">Remplissez le formulaire pour voir l'aperçu...</p>
              )}
            </Card>
          </div>

          {/* Generated Questions */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Questions Générées</h2>
              
              {isGenerating ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Génération des questions en cours...</p>
                </div>
              ) : generatedQuestions ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {generatedQuestions.length} questions générées
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="secondary" size="sm">Régénérer</Button>
                      <Button variant="outline" size="sm">Exporter</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedQuestions.map((q, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Question {index + 1}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getCategoryColor(q.category)}`}>
                            <span>{getCategoryIcon(q.category)}</span>
                            <span>{q.category}</span>
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{q.question}</p>
                        {q.purpose && (
                          <p className="text-xs text-gray-500 mt-2">Objectif: {q.purpose}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">
                          {generatedQuestions.filter(q => q.category === 'Job Description').length}
                        </div>
                        <div className="text-gray-600">Job Description</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {generatedQuestions.filter(q => q.category === 'Company Culture').length}
                        </div>
                        <div className="text-gray-600">Company Culture</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">
                          {generatedQuestions.filter(q => q.category === 'CV/Professional Life').length}
                        </div>
                        <div className="text-gray-600">CV/Professional</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">❓</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune question générée</h3>
                  <p className="text-gray-600">Remplissez le contexte pour générer des questions d'entretien</p>
                </div>
              )}
            </Card>
          </div>
        </div>

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

export default Context;
