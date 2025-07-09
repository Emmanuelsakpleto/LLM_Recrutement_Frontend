import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import BriefSelector from '../components/BriefSelector';
import { jobService, companyContextService, JobBrief } from '../services/api';
import BriefActions from '../components/BriefActions'; // Ajoutez cette importation
import { useCompanyContext } from '../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import ContextSelector, { CompanyContextType } from '../components/ContextSelector';

interface BriefProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  briefs: JobBrief[];
  setBriefs: (briefs: JobBrief[]) => void;
}

const Brief: React.FC<BriefProps> = ({ activeBrief, onBriefChange, briefs, setBriefs }) => {
  const { companyContext } = useCompanyContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    skills: '',
    experience: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submittedBrief, setSubmittedBrief] = useState<JobBrief | null>(null);
  const [contexts, setContexts] = useState<CompanyContextType[]>([]);

  // Suppression de la redirection automatique vers /context si pas de contexte sélectionné

  // Charger les briefs depuis l'API au montage du composant
  useEffect(() => {
    const fetchBriefs = async () => {
      const briefsResponse = await jobService.getBriefs();
      if (briefsResponse.data) setBriefs(briefsResponse.data);
    };
    fetchBriefs();
  }, [setBriefs]);

  // Charger dynamiquement les contextes d'entreprise
  const fetchContexts = async () => {
    const res = await companyContextService.getContexts();
    if (res.data) setContexts(res.data);
  };
  useEffect(() => {
    fetchContexts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.skills || !formData.experience || !formData.description) {
      setToast({ message: 'Tous les champs sont requis', type: 'error' });
      return;
    }

    if (Array.isArray(briefs) && briefs.some(b => b.title.trim().toLowerCase() === formData.title.trim().toLowerCase())) {
      setToast({ message: 'Un brief avec ce titre existe déjà.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill)
        .map(skill => skill.replace(/^"+|"+$/g, ''));

      const response = await jobService.createBrief({
        title: formData.title,
        skills: skillsArray,
        experience: formData.experience === 'Stagiaire' ? '0-1 ans' : formData.experience,
        description: formData.description,
        context_id: companyContext?.id // Ajout du context_id obligatoire
      });

      // Vérifier si la réponse contient des données et pas d'erreur
      if (response.data && response.data.brief) {
        setSubmittedBrief(response.data.brief as JobBrief);
        setToast({ message: response.message || 'Brief soumis avec succès !', type: 'success' });
        setFormData({ title: '', skills: '', experience: '', description: '' });

        const briefsResponse = await jobService.getBriefs();
        if (briefsResponse.data) setBriefs(briefsResponse.data);

        if (!activeBrief) onBriefChange(response.data.brief as JobBrief);
      } else {
        setToast({ message: response.error || 'Erreur lors de la soumission', type: 'error' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erreur réseau ou inattendue', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ajout d'un bouton pour créer un nouveau brief
  const handleNewBrief = () => {
    setFormData({ title: '', skills: '', experience: '', description: '' });
    setSubmittedBrief(null);
    onBriefChange(null); // Désélectionner le brief actif pour afficher le formulaire
  };

  // Sélection automatique d'un autre brief après suppression
  const handleDelete = async (briefId: number) => {
    const response = await jobService.deleteBrief(briefId);
    if (response.status === 'success') {
      // Recharge la liste des briefs depuis l'API après suppression
      const briefsResponse = await jobService.getBriefs();
      if (briefsResponse.data) {
        setBriefs(briefsResponse.data);
      }
      // Optionnel : réinitialiser le brief actif si besoin
      if (activeBrief && activeBrief.id === briefId) {
        onBriefChange(null);
      }
    }
  };

  const skillsArray = formData.skills
    .split(',')
    .map(skill => skill.trim())
    .filter(skill => skill)
    .map(skill => skill.replace(/^"+|"+$/g, ''));

  // Nouveau composant pour afficher un brief avec toutes les actions
  const BriefCard: React.FC<{
    brief: JobBrief;
    onBriefUpdated: (updatedBrief: JobBrief) => void;
    onBriefDeleted: (id: number) => void;
  }> = ({ brief, onBriefUpdated, onBriefDeleted }) => {
    const getFullData = (data: any) => {
      if (!data) return null;
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('Erreur de parsing full_data:', e, data);
          return null;
        }
      }
      if (typeof data === 'object') return data;
      return null;
    };

    const fullData = getFullData(brief.full_data);

    return (
      <Card className="p-6 border-green-200 bg-green-50 mt-6">
        <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
          <span className="mr-2">✅</span>
          Brief de Poste
        </h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">ID:</span> {brief.id}</p>
          <p><span className="font-medium">Titre:</span> {brief.title}</p>
          <p><span className="font-medium">Créé le:</span> {new Date(brief.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
        {fullData && (
          <>
            <div>
              <span className="font-semibold text-green-800 mb-1">Responsabilités :</span>
              <ul className="list-disc list-inside text-sm text-green-700">
                {fullData.responsibilities?.map((resp: string, idx: number) => (
                  <li key={idx}>{resp}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-green-800 mb-1">Qualifications :</span>
              <ul className="list-disc list-inside text-sm text-green-700">
                {fullData.qualifications?.map((qual: string, idx: number) => (
                  <li key={idx}>{qual}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        <div className="mt-4">
          <BriefActions
            brief={brief}
            onBriefUpdated={onBriefUpdated}
            onBriefDeleted={onBriefDeleted}
          />
        </div>
      </Card>
    );
  };

  // Fonction pour rafraîchir la liste des briefs depuis l'API
  const handleRefreshBriefs = async () => {
    const briefsResponse = await jobService.getBriefs();
    if (briefsResponse.data) setBriefs(briefsResponse.data);
  };

  // Vérification explicite de la prop setBriefs
  if (typeof setBriefs !== 'function') {
    return (
      <div style={{color:'red',background:'#fff0f0',padding:'16px',border:'1px solid #ffccc7',borderRadius:'8px',margin:'16px 0'}}>
        Erreur critique : la prop <b>setBriefs</b> n'est pas une fonction !<br />
        Vérifiez l'appel à &lt;Brief ... setBriefs=&#123;setBriefs&#125; /&gt; dans App.tsx et partout où ce composant est utilisé.
      </div>
    );
  }

  // Sécuriser briefs pour éviter les erreurs si undefined
  const safeBriefs = Array.isArray(briefs) ? briefs : [];

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saisie du Brief de Poste</h1>
          <p className="text-gray-600">Définissez les critères et exigences pour le poste à pourvoir</p>
          <div className="flex items-center justify-between mb-4">
            <BriefSelector
              activeBrief={activeBrief}
              onBriefChange={onBriefChange}
              briefs={briefs}
              onDeleteBrief={handleDelete}
              onRefreshBriefs={handleRefreshBriefs}
            />
            <Button variant="primary" onClick={handleNewBrief} className="ml-4">
              Nouveau brief
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations du Poste</h2>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="ex: Python, Django, React, PostgreSQL (séparées par des virgules)"
                  rows={3}
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
                  <option value="0-1 ans">Stagiaire</option>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Décrivez les missions, responsabilités et objectifs du poste..."
                  rows={5}
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
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Aperçu en Temps Réel</h2>
            <Card className="p-6">
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
              {/* Affichage du brief actif sélectionné */}
              {activeBrief && (
                <BriefCard
                  brief={activeBrief}
                  onBriefUpdated={updatedBrief => onBriefChange(updatedBrief)}
                  onBriefDeleted={id => handleDelete(id)}
                />
              )}
              {/* Affichage du brief soumis après création */}
              {submittedBrief && !activeBrief && (
                <BriefCard
                  brief={submittedBrief}
                  onBriefUpdated={updatedBrief => setSubmittedBrief(updatedBrief)}
                  onBriefDeleted={id => {
                    handleDelete(id);
                    setSubmittedBrief(null);
                  }}
                />
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

export default Brief;