import React, { useState } from 'react';
import { JobBrief, jobService } from '../services/api';
import Button from './Button';
import Toast from './Toast';

interface BriefActionsProps {
  brief: JobBrief;
  onBriefUpdated: (updatedBrief: JobBrief) => void;
  onBriefDeleted: (briefId: number) => void;
}

const BriefActions: React.FC<BriefActionsProps> = ({
  brief,
  onBriefUpdated,
  onBriefDeleted
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    title: brief.title,
    skills: Array.isArray(brief.skills) ? brief.skills.join(', ') : '',
    experience: brief.experience,
    description: brief.description
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      title: brief.title,
      skills: Array.isArray(brief.skills) ? brief.skills.join(', ') : '',
      experience: brief.experience,
      description: brief.description
    });
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    const skillsArray = formData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill);

    try {
      const response = await jobService.updateBrief(brief.id, {
        title: formData.title,
        skills: skillsArray,
        experience: formData.experience,
        description: formData.description
      });

      // Vérifier si la réponse indique le succès et contient les données mises à jour
      if (response && response.status === 'success' && response.data) { // <-- Condition corrigée
        onBriefUpdated(response.data); // <-- Utiliser response.data pour les données de la fiche
        setIsEditing(false);
        setToast({ message: response.message || 'Fiche modifiée avec succès ! ', type: 'success' }); // <-- Utiliser response.message
      } else {
        // Gérer les cas où la réponse n'indique pas le succès ou manque de données
        setToast({ message: response?.message || response?.error || 'Erreur lors de la modification', type: 'error' }); // <-- Gérer les messages d'erreur
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de la fiche:', error);
      setToast({ message: error.message || 'Erreur réseau lors de la modification', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche de poste ?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await jobService.deleteBrief(brief.id);
      
      if (response.error) {
        setToast({ message: response.error, type: 'error' });
      } else {
        onBriefDeleted(brief.id);
        setToast({ message: 'Fiche supprimée avec succès !', type: 'success' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await jobService.exportBriefToPDF(brief);
      setToast({ message: 'Fiche exportée avec succès !', type: 'success' });
    } catch (error) {
      setToast({ message: 'Erreur lors de l\'export', type: 'error' });
    }
  };

  const handleCopy = async () => {
    try {
      await jobService.copyBriefToClipboard(brief);
      setToast({ message: 'Fiche copiée dans le presse-papiers !', type: 'success' });
    } catch (error) {
      setToast({ message: 'Erreur lors de la copie', type: 'error' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre du Poste
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
            Compétences (séparées par des virgules)
          </label>
          <textarea
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
            Expérience
          </label>
          <select
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="0-1 ans">0-1 ans (Junior)</option>
            <option value="2-3 ans">2-3 ans</option>
            <option value="4-6 ans">4-6 ans (Senior)</option>
            <option value="7+ ans">7+ ans (Expert)</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          <Button variant="primary" size="sm" onClick={handleSaveEdit}>
            Sauvegarder
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
            Annuler
          </Button>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <Button variant="secondary" size="sm" onClick={handleEdit}>
        Modifier
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        Copier
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF}>
        Export PDF
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete}
        loading={isDeleting}
      >
        {isDeleting ? 'Suppression...' : 'Supprimer'}
      </Button>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default BriefActions;
