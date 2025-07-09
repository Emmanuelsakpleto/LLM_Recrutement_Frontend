// Remplacer le contenu de BriefSelector.tsx
import React, { useState } from 'react';
import { JobBrief } from '../services/api';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { jobService } from '../services/api';
import BriefActions from './BriefActions';
import BriefDropdown from './BriefDropdown';

interface BriefSelectorProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  briefs: JobBrief[];
  onRefreshBriefs?: () => void;
  onDeleteBrief?: (id: number) => void;
}

const BriefSelector: React.FC<BriefSelectorProps> = ({ activeBrief, onBriefChange, briefs, onRefreshBriefs, onDeleteBrief }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExport = async (brief: JobBrief) => {
    try {
      await jobService.exportBriefToPDF(brief);
      setToast({ message: 'PDF exporté avec succès !', type: 'success' });
    } catch (error: any) {
      setToast({ message: `Erreur lors de l'export : ${error.message}`, type: 'error' });
    }
  };

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

  const safeBriefs = Array.isArray(briefs) ? briefs : [];
  const fullData = getFullData(activeBrief?.full_data);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fas fa-briefcase text-blue-600 text-lg"></i>
          <h3 className="text-lg font-semibold text-gray-900">Brief Actif</h3>
        </div>
        <BriefDropdown
          briefs={safeBriefs}
          activeBriefId={activeBrief?.id || null}
          onSelect={id => {
            const brief = safeBriefs.find(b => b.id === id);
            onBriefChange(brief || null);
          }}
          onRefresh={onRefreshBriefs}
        />
      </div>
      {activeBrief && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900 text-xl">{activeBrief.title}</h4>
            {onDeleteBrief && (
              <button
                className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment supprimer ce brief ?')) onDeleteBrief(activeBrief.id);
                }}
              >
                Supprimer
              </button>
            )}
          </div>
          <div>
            <span className="font-semibold text-blue-800 mb-1">Expérience requise :</span>
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              {activeBrief.experience || 'Non précisé'}
            </span>
          </div>
          <div>
            <span className="font-semibold text-blue-800 mb-1">Compétences requises :</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {Array.isArray(activeBrief.skills) && activeBrief.skills.length > 0 ? (
                activeBrief.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-xs">Non précisé</span>
              )}
            </div>
          </div>
          <div>
            <span className="font-semibold text-blue-800 mb-1">Date :</span>
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              {new Date(activeBrief.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          {fullData && (
            <>
              <div>
                <span className="font-semibold text-blue-800 mb-1">Responsabilités :</span>
                <ul className="list-disc list-inside text-sm text-blue-700">
                  {Array.isArray(fullData?.responsibilities) && fullData.responsibilities.map((resp: string, idx: number) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-semibold text-blue-800 mb-1">Qualifications :</span>
                <ul className="list-disc list-inside text-sm text-blue-700">
                  {Array.isArray(fullData?.qualifications) && fullData.qualifications.map((qual: string, idx: number) => (
                    <li key={idx}>{qual}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <div className="mt-4">
            <BriefActions
              brief={activeBrief}
              onBriefUpdated={updatedBrief => onBriefChange(updatedBrief)}
              onBriefDeleted={id => {
                if (onDeleteBrief) onDeleteBrief(id);
                onBriefChange(null);
              }}
            />
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default BriefSelector;