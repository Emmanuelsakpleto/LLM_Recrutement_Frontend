
import React from 'react';
import { JobBrief } from '../services/api';

interface BriefSelectorProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  briefs: JobBrief[];
}

const BriefSelector: React.FC<BriefSelectorProps> = ({ activeBrief, onBriefChange, briefs }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fas fa-briefcase text-blue-600 text-lg"></i>
          <h3 className="text-lg font-semibold text-gray-900">Brief Actif</h3>
        </div>
        
        <select
          value={activeBrief?.id || ''}
          onChange={(e) => {
            const brief = briefs.find(b => b.id === parseInt(e.target.value));
            onBriefChange(brief || null);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sélectionner un brief...</option>
          {briefs.map((brief) => (
            <option key={brief.id} value={brief.id}>
              {brief.title} (ID: {brief.id})
            </option>
          ))}
        </select>
      </div>
      
      {activeBrief && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">{activeBrief.title}</h4>
          <p className="text-sm text-blue-700 mb-2">{activeBrief.description}</p>
          <div className="flex flex-wrap gap-2">
            {activeBrief.skills.map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefSelector;
