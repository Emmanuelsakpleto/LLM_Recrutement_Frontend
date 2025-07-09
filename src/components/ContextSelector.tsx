import React, { useState } from 'react';
import Toast from './Toast';
import { useCompanyContext } from '../context/CompanyContext';
import { companyContextService, CompanyContextType } from '../services/api';

interface ContextSelectorProps {
  contexts: CompanyContextType[];
  onContextsChange?: () => void; // callback pour rafraîchir la liste
}

const ContextSelector: React.FC<ContextSelectorProps> = ({ contexts, onContextsChange }) => {
  const { companyContext, setCompanyContext } = useCompanyContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom_entreprise: '', domaine: '', values: '', culture: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.nom_entreprise || !form.domaine || !form.values || !form.culture) {
        setError('Tous les champs sont requis');
        setLoading(false);
        return;
      }
      console.log('[DEBUG] Tentative création contexte', form);
      const res = await companyContextService.createContext({
        nom_entreprise: form.nom_entreprise,
        domaine: form.domaine,
        values: form.values.split(',').map(v => v.trim()).filter(Boolean),
        culture: form.culture
      });
      console.log('[DEBUG] Réponse création contexte', res);
      if (res.data && onContextsChange) {
        await onContextsChange();
        // Sélectionner automatiquement le contexte créé comme actif
        if (res.data.context_id) {
          const newCtx = contexts.find(ctx => ctx.id === res.data.context_id);
          if (newCtx) setCompanyContext(newCtx);
        }
      }
      setShowForm(false);
      setForm({ nom_entreprise: '', domaine: '', values: '', culture: '' });
      setToast({ message: 'Contexte créé avec succès', type: 'success' });
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
      setToast({ message: e.message || 'Erreur lors de la création', type: 'error' });
      console.error('[DEBUG] Erreur création contexte', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Supprimer ce contexte ?')) return;
    setLoading(true);
    try {
      await companyContextService.deleteContext(id);
      if (onContextsChange) onContextsChange();
      if (companyContext?.id === id) setCompanyContext(null);
      setToast({ message: 'Contexte supprimé', type: 'success' });
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la suppression');
      setToast({ message: e.message || 'Erreur lors de la suppression', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <label className="block text-sm font-medium text-gray-700 mb-1">Contexte d'entreprise</label>
      <div className="flex gap-2 items-center">
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          value={companyContext?.id || ''}
          onChange={e => {
            const selected = contexts.find(ctx => String(ctx.id) === e.target.value);
            setCompanyContext(selected || null);
          }}
        >
          <option value="">Sélectionnez un contexte...</option>
          {contexts.map(ctx => (
            <option key={ctx.id} value={ctx.id}>
              {ctx.nom_entreprise} ({ctx.domaine})
            </option>
          ))}
        </select>
        <button
          className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
          title="Ajouter un contexte"
          onClick={() => setShowForm(v => !v)}
          type="button"
        >
          +
        </button>
      </div>
      {/* Liste avec suppression */}
      <ul className="mt-2 space-y-1">
        {contexts.map(ctx => (
          <li key={ctx.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
            <span>{ctx.nom_entreprise} <span className="text-gray-400">({ctx.domaine})</span></span>
            <button
              className="text-red-500 hover:text-red-700 ml-2"
              title="Supprimer"
              onClick={() => handleDelete(ctx.id)}
              type="button"
              disabled={loading}
            >🗑️</button>
          </li>
        ))}
      </ul>
      {/* Formulaire création */}
      {showForm && (
        <form className="mt-3 p-3 bg-gray-100 rounded space-y-2" onSubmit={handleCreate}>
          <input
            className="w-full px-2 py-1 border rounded"
            placeholder="Nom de l'entreprise"
            value={form.nom_entreprise}
            onChange={e => setForm(f => ({ ...f, nom_entreprise: e.target.value }))}
            disabled={loading}
          />
          <input
            className="w-full px-2 py-1 border rounded"
            placeholder="Domaine"
            value={form.domaine}
            onChange={e => setForm(f => ({ ...f, domaine: e.target.value }))}
            disabled={loading}
          />
          <input
            className="w-full px-2 py-1 border rounded"
            placeholder="Valeurs (séparées par virgule)"
            value={form.values}
            onChange={e => setForm(f => ({ ...f, values: e.target.value }))}
            disabled={loading}
          />
          <textarea
            className="w-full px-2 py-1 border rounded"
            placeholder="Culture d'entreprise"
            value={form.culture}
            onChange={e => setForm(f => ({ ...f, culture: e.target.value }))}
            disabled={loading}
          />
          {error && <div className="text-red-600 text-xs">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </button>
            <button type="button" className="bg-gray-300 px-3 py-1 rounded" onClick={() => setShowForm(false)} disabled={loading}>
              Annuler
            </button>
          </div>
        </form>
      )}
      <div className="flex gap-2 items-center">
        {loading && <span className="text-xs text-blue-600 animate-pulse">Chargement...</span>}
      </div>
    </div>
  );
};

export default ContextSelector;
