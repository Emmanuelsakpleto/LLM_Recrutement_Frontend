import React from 'react';
import { Candidate } from '../services/api';

interface CandidateDropdownProps {
  candidates: Candidate[];
  selectedCandidateId: number | null;
  onSelect: (candidateId: number | null) => void;
}

const CandidateDropdown: React.FC<CandidateDropdownProps> = ({ candidates, selectedCandidateId, onSelect }) => {
  console.log('🎯 CandidateDropdown reçoit:', {
    candidatesCount: candidates.length,
    candidates: candidates.map(c => ({ id: c.id, name: c.name, brief_id: c.brief_id })),
    selectedCandidateId
  });
  
  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-medium mb-1">Sélectionner un CV analysé :</label>
      <select
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedCandidateId !== null ? String(selectedCandidateId) : ''}
        onChange={e => {
          const val = e.target.value;
          onSelect(val ? Number(val) : null);
        }}
      >
        <option value="">Aucun CV sélectionné</option>
        {candidates.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CandidateDropdown;
