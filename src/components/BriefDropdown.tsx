import React from 'react';
import { JobBrief } from '../services/api';

interface BriefDropdownProps {
  briefs: JobBrief[];
  activeBriefId?: number | null;
  onSelect: (briefId: number | null) => void;
  onRefresh?: () => void;
}

const BriefDropdown: React.FC<BriefDropdownProps> = ({ briefs, activeBriefId, onSelect, onRefresh }) => {
  return (
    <select
      value={activeBriefId || ''}
      onChange={e => {
        const val = e.target.value;
        onSelect(val ? parseInt(val) : null);
      }}
      onFocus={onRefresh}
      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Sélectionner un brief...</option>
      {briefs && briefs.length > 0 ? (
        briefs.map(brief => (
          <option key={brief.id} value={brief.id}>
            {brief.title} (ID: {brief.id})
          </option>
        ))
      ) : (
        <option disabled>Aucun brief disponible</option>
      )}
    </select>
  );
};

export default BriefDropdown;
