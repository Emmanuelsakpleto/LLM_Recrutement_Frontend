
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import BriefSelector from '../components/BriefSelector';
import { jobService, JobBrief } from '../services/api';

interface BriefProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  briefs: JobBrief[];
  setBriefs: (briefs: JobBrief[]) => void;
}

const Brief: React.FC<BriefProps> = ({ activeBrief, onBriefChange, briefs, setBriefs }) => {
  const [formData, setFormData] = useState({
    title: '',
    skills: '',
    experience: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submittedBrief, setSubmittedBrief] = useState<JobBrief | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.skills || !formData.experience || !formData.description) {
      setToast({ message: 'Tous les champs sont requis', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convertir les compétences en array
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      const response = await jobService.createBrief({
        title: formData.title,
        skills: skillsArray,
        experience: formData.experience,
        description: formData.description
      });

      if (response.data) {
        setSubmittedBrief(response.data);
        setToast({ message: 'Brief soumis avec succès !', type: 'success' });
        setFormData({ title: '', skills: '', experience: '', description: '' });
        
        // Mettre à jour la liste des briefs
        const updatedBriefs = [...briefs, response.data];
        setBriefs(updatedBriefs);
        
        // Si c'est le premier brief, le définir comme actif
        if (!activeBrief) {
          onBriefChange(response.data);
        }
      } else {
        setToast({ message: response.error || 'Erreur lors de la soumission', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la soumission', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saisie du Brief de Poste</h1>
          <p className="text-gray-600">Définissez les critères et exigences pour le poste à pourvoir</p>
        </div>

        <BriefSelector
          activeBrief={activeBrief}
          onBriefChange={onBriefChange}
          briefs={briefs}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations du Poste</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du Poste *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="ex: Développeur Full-Stack Senior"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                  Compétences Requises *
                </label>
                <textarea
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="ex: Python, Django, React, PostgreSQL (séparées par des virgules)"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {skillsArray.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillsArray.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Années d'Expérience *
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Sélectionnez l'expérience requise</option>
                  <option value="0-1 ans">0-1 ans (Junior)</option>
                  <option value="2-3 ans">2-3 ans</option>
                  <option value="4-6 ans">4-6 ans (Senior)</option>
                  <option value="7+ ans">7+ ans (Expert)</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description du Poste *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Décrivez les missions, responsabilités et objectifs du poste..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                loading={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Soumission en cours...' : 'Soumettre le Brief'}
              </Button>
            </form>
          </Card>

          {/* Preview */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Aperçu en Temps Réel</h2>
              
              {formData.title || formData.skills || formData.experience || formData.description ? (
                <div className="space-y-4">
                  {formData.title && (
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{formData.title}</h3>
                    </div>
                  )}
                  
                  {formData.experience && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Expérience:</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                        {formData.experience}
                      </span>
                    </div>
                  )}
                  
                  {skillsArray.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Compétences:</span>
                      <div className="flex flex-wrap gap-2">
                        {skillsArray.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.description && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Description:</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{formData.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">Commencez à remplir le formulaire pour voir l'aperçu...</p>
              )}
            </Card>

            {submittedBrief && (
              <Card className="p-6 border-green-200 bg-green-50">
                <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
                  <span className="mr-2">✅</span>
                  Brief Soumis
                </h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">ID:</span> {submittedBrief.id}</p>
                  <p><span className="font-medium">Titre:</span> {submittedBrief.title}</p>
                  <p><span className="font-medium">Créé le:</span> {new Date(submittedBrief.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button variant="secondary" size="sm">Modifier</Button>
                  <Button variant="outline" size="sm">Exporter</Button>
                </div>
              </Card>
            )}
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

export default Brief;
