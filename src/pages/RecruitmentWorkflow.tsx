import React, { useState, useEffect } from 'react';
import ProcessDashboard from './ProcessDashboard';
import { jobBriefService } from '../services/api';

interface JobBrief {
  id: number;
  title: string;
  description: string;
  status: string;
}

const RecruitmentWorkflow: React.FC = () => {
  const [jobBriefs, setJobBriefs] = useState<JobBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<JobBrief | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les fiches de poste
  useEffect(() => {
    loadJobBriefs();
  }, []);

  const loadJobBriefs = async () => {
    try {
      const response = await jobBriefService.getJobBriefs();
      setJobBriefs(response.data || []);
      
      // Sélectionner automatiquement la première fiche si disponible
      if (response.data && response.data.length > 0) {
        setSelectedBrief(response.data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement fiches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des fiches de poste...</p>
        </div>
      </div>
    );
  }

  if (jobBriefs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Aucune Fiche de Poste
          </h2>
          <p className="text-gray-600 mb-6">
            Créez d'abord des fiches de poste pour commencer le processus de recrutement.
          </p>
          <button
            onClick={() => window.location.href = '/brief'}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Créer une Fiche de Poste
          </button>
        </div>
      </div>
    );
  }

  if (!selectedBrief) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Workflow de Recrutement
            </h1>
            <p className="text-gray-600">
              Sélectionnez une fiche de poste pour commencer le processus de recrutement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobBriefs.map((brief) => (
              <div
                key={brief.id}
                onClick={() => setSelectedBrief(brief)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {brief.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {brief.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    brief.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {brief.status === 'active' ? 'Actif' : brief.status}
                  </span>
                  <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                    Sélectionner →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProcessDashboard
      briefId={selectedBrief.id}
      briefTitle={selectedBrief.title}
    />
  );
};

export default RecruitmentWorkflow;
