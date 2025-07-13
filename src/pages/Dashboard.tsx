import React, { useState, useEffect, useRef } from 'react';
import CandidateCard from '../components/CandidateCard';
import RadarChart from '../components/RadarChart';
import Card from '../components/Card';
import Button from '../components/Button';
import BriefSelector from '../components/BriefSelector';
import ContextSelector, { CompanyContextType } from '../components/ContextSelector';
import { candidateService, JobBrief, Candidate, companyContextService } from '../services/api';
import { filterCandidatesByBrief } from '../lib/utils';
import { useCompanyContext } from '../context/CompanyContext';
import { useNavigate } from 'react-router-dom';

const COLORS = [
  '#3b82f6', // bleu
  '#ef4444', // rouge
  '#10b981', // vert
  '#f59e42', // orange
  '#a855f7', // violet
  '#6366f1', // indigo
  '#f43f5e', // rose
];

interface DashboardProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  briefs: JobBrief[];
  setBriefs: (briefs: JobBrief[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  activeBrief, 
  onBriefChange, 
  candidates, 
  setCandidates,
  briefs,
  setBriefs 
}) => {
  const { companyContext } = useCompanyContext();
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filter, setFilter] = useState('all');
  const [contexts, setContexts] = useState<CompanyContextType[]>([]);
  const radarRef = useRef<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<number>>(new Set());

  const filteredByBrief = filterCandidatesByBrief(candidates, activeBrief);

  // Sélectionner le premier candidat du brief actif par défaut
  useEffect(() => {
    if (filteredByBrief.length > 0 && !selectedCandidate) {
      setSelectedCandidate(filteredByBrief[0]);
    }
  }, [filteredByBrief, selectedCandidate]);

  const filteredCandidates = filteredByBrief.filter(candidate => {
    if (filter === 'all') return true;
    if (filter === 'recommended') return candidate.status === 'Recommandé';
    if (filter === 'review') return candidate.status === 'À revoir';
    if (filter === 'evaluation') return candidate.status === 'En évaluation';
    return true;
  });

  // Créer des données radar basées sur les données réelles du candidat
  const createRadarData = (candidate: Candidate) => {
    if (!candidate.cv_analysis) return {};
    
    return {
      'Compétences': candidate.cv_analysis.score || 75,
      'Expérience': Math.min(candidate.cv_analysis.experience?.length * 20 || 60, 100),
      'Formation': Math.min(candidate.cv_analysis.education?.length * 25 || 70, 100),
      'Culture': candidate.predictive_score || 80,
      'Entretien': candidate.appreciations?.length > 0 
        ? candidate.appreciations.reduce((acc, app) => acc + app.score, 0) / candidate.appreciations.length * 25
        : 0
    };
  };

  // Générer des risques et recommandations basés sur les données réelles
  const generateRisksAndRecommendations = (candidate: Candidate) => {
    // Utiliser les risques et recommandations générés par l'IA si disponibles
    if (candidate.risks && candidate.recommendations) {
      const risks = Array.isArray(candidate.risks) ? candidate.risks : [];
      
      // Les recommandations peuvent être un objet ou un array
      let recommendations = [];
      if (Array.isArray(candidate.recommendations)) {
        recommendations = candidate.recommendations;
      } else if (candidate.recommendations && typeof candidate.recommendations === 'object') {
        // Si c'est un objet avec une structure {recommendation: "...", actions: [...]}
        const recObj = candidate.recommendations as any;
        if (recObj.recommendation) {
          recommendations.push(recObj.recommendation);
          if (recObj.actions && Array.isArray(recObj.actions)) {
            recommendations.push(...recObj.actions);
          }
        }
      }
      
      return { risks, recommendations };
    }

    // Fallback vers la génération statique si pas de données IA
    const risks = [];
    const recommendations = [];

    if (candidate.predictive_score < 70) {
      risks.push('Score prédictif en dessous du seuil recommandé');
      recommendations.push('Organiser un entretien complémentaire technique');
    }

    if (!candidate.cv_analysis?.competences || candidate.cv_analysis.competences.length < 3) {
      risks.push('Nombre de compétences techniques limité');
      recommendations.push('Formation technique complémentaire requise');
    }

    if (candidate.appreciations?.length === 0) {
      risks.push('Aucune évaluation d\'entretien disponible');
      recommendations.push('Finaliser l\'évaluation d\'entretien');
    }

    return { risks, recommendations };
  };

  // Préparation des datasets pour le radar comparatif multi-candidats
  const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e42', '#a855f7', '#6366f1', '#f43f5e'
  ];
  const evaluatedCandidates = filteredByBrief.filter(c => ['En évaluation', 'Recommandé'].includes(c.status));
  const radarDatasets = evaluatedCandidates.map((c, i) => {
    const ca: any = c.cv_analysis || {};
    const cand: any = c; // pour appreciations
    return {
      name: c.name,
      color: COLORS[i % COLORS.length],
      values: {
        'Compétences': ca.score !== undefined ? Number(Number(ca.score).toFixed(1)) : 0,
        'Expérience': ca.experience && Array.isArray(ca.experience) ? Number(Math.min(ca.experience.length * 20, 100).toFixed(1)) : 0,
        'Formation': ca.education && Array.isArray(ca.education) ? Number(Math.min(ca.education.length * 25, 100).toFixed(1)) : 0,
        'Culture': c.predictive_score !== undefined && c.predictive_score !== null ? Number(Number(c.predictive_score).toFixed(1)) : 0,
        'Entretien': cand.appreciations && cand.appreciations.length > 0
          ? Number((cand.appreciations.reduce((acc: number, app: any) => acc + app.score, 0) / cand.appreciations.length * 25).toFixed(1))
          : 0
      }
    };
  });

  // Fonction utilitaire locale pour afficher le score principal du candidat
  function getDisplayScore(candidate: Candidate): { displayScore: number; scoreLabel: string } {
    // Priorité : score prédictif > score analyse CV > score RH
    if (typeof candidate.predictive_score === 'number' && !isNaN(candidate.predictive_score)) {
      return { displayScore: Math.round(candidate.predictive_score * 10) / 10, scoreLabel: 'Score prédictif' };
    }
    if (candidate.cv_analysis && typeof candidate.cv_analysis.score === 'number' && !isNaN(candidate.cv_analysis.score)) {
      return { displayScore: Math.round(candidate.cv_analysis.score * 10) / 10, scoreLabel: 'Score analyse CV' };
    }
    if (Array.isArray(candidate.appreciations) && candidate.appreciations.length > 0) {
      // Score RH (moyenne des appréciations)
      const avg = candidate.appreciations.reduce((acc, app) => acc + (typeof app.score === 'number' && !isNaN(app.score) ? app.score : 0), 0) / candidate.appreciations.length;
      return { displayScore: Math.round(avg * 25 * 10) / 10, scoreLabel: 'Score RH' };
    }
    return { displayScore: 0, scoreLabel: 'Score' };
  }

  // Fonctions pour la comparaison
  const toggleCandidateComparison = (candidateId: number) => {
    const newSelected = new Set(selectedForComparison);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else if (newSelected.size < 5) { // Limite à 5 candidats pour la lisibilité
      newSelected.add(candidateId);
    }
    setSelectedForComparison(newSelected);
  };

  const clearComparison = () => {
    setSelectedForComparison(new Set());
  };

  // Fonction pour obtenir les données radar d'un candidat
  const getRadarDataFromBackend = (candidate: Candidate) => {
    // Utiliser d'abord les scores de la base de données (score_details)
    if (candidate && candidate.score_details) {
      const scores = candidate.score_details;
      return {
        'Compétences': typeof scores.skills_score === 'number' ? Number(scores.skills_score.toFixed(1)) : 0,
        'Expérience': typeof scores.experience_score === 'number' ? Number(scores.experience_score.toFixed(1)) : 0,
        'Formation': typeof scores.education_score === 'number' ? Number(scores.education_score.toFixed(1)) : 0,
        'Culture': typeof scores.culture_score === 'number' ? Number(scores.culture_score.toFixed(1)) : 0,
        'Entretien': typeof scores.interview_score === 'number' ? Number(scores.interview_score.toFixed(1)) : 0
      };
    }
    
    // Fallback : utiliser radar_data si score_details n'est pas disponible
    if (candidate && candidate.radar_data) {
      const radar = candidate.radar_data;
      return {
        'Compétences': typeof radar['Compétences'] === 'number' ? Number(radar['Compétences'].toFixed(1)) : 0,
        'Expérience': typeof radar['Expérience'] === 'number' ? Number(radar['Expérience'].toFixed(1)) : 0,
        'Formation': typeof radar['Formation'] === 'number' ? Number(radar['Formation'].toFixed(1)) : 0,
        'Culture': typeof radar['Culture'] === 'number' ? Number(radar['Culture'].toFixed(1)) : 0,
        'Entretien': typeof radar['Entretien'] === 'number' ? Number(radar['Entretien'].toFixed(1)) : 0
      };
    }
    
    // Dernier fallback : ancienne logique locale
    const ca: any = candidate.cv_analysis || {};
    const appreciations = Array.isArray(candidate.appreciations) ? candidate.appreciations : [];
    return {
      'Compétences': typeof ca.score === 'number' ? Number(ca.score.toFixed(1)) : 0,
      'Expérience': Array.isArray(ca.experience) ? Number(Math.min(ca.experience.length * 20, 100).toFixed(1)) : 0,
      'Formation': Array.isArray(ca.education) ? Number(Math.min(ca.education.length * 25, 100).toFixed(1)) : 0,
      'Culture': typeof candidate.predictive_score === 'number' ? Number(candidate.predictive_score.toFixed(1)) : 0,
      'Entretien': appreciations.length > 0 ? Number((appreciations.reduce((acc: number, app: any) => acc + (typeof app.score === 'number' ? app.score : 0), 0) / appreciations.length * 25).toFixed(1)) : 0
    };
  };

  // Données pour le radar comparatif
  const comparisonRadarData = Array.from(selectedForComparison).map((candidateId, index) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return null;
    
    return {
      name: candidate.name,
      color: COLORS[index % COLORS.length],
      values: getRadarDataFromBackend(candidate)
    };
  }).filter(Boolean);

  // Remplacer la génération du radarData par les données backend si présentes
  /* const getRadarDataFromBackend = (candidate: Candidate) => {
    if (candidate && candidate.radar_data) {
      const radar = candidate.radar_data;
      return {
        'Compétences': typeof radar['Compétences'] === 'number' ? Number(radar['Compétences'].toFixed(1)) : 0,
        'Expérience': typeof radar['Expérience'] === 'number' ? Number(radar['Expérience'].toFixed(1)) : 0,
        'Formation': typeof radar['Formation'] === 'number' ? Number(radar['Formation'].toFixed(1)) : 0,
        'Culture': typeof radar['Culture'] === 'number' ? Number(radar['Culture'].toFixed(1)) : 0,
        'Entretien': typeof radar['Entretien'] === 'number' ? Number(radar['Entretien'].toFixed(1)) : 0
      };
    }
    // Fallback : ancienne logique locale
    const ca: any = candidate.cv_analysis || {};
    const appreciations = Array.isArray(candidate.appreciations) ? candidate.appreciations : [];
    return {
      'Compétences': typeof ca.score === 'number' ? Number(ca.score.toFixed(1)) : 0,
      'Expérience': Array.isArray(ca.experience) ? Number(Math.min(ca.experience.length * 20, 100).toFixed(1)) : 0,
      'Formation': Array.isArray(ca.education) ? Number(Math.min(ca.education.length * 25, 100).toFixed(1)) : 0,
      'Culture': typeof candidate.predictive_score === 'number' ? Number(candidate.predictive_score.toFixed(1)) : 0,
      'Entretien': appreciations.length > 0 ? Number((appreciations.reduce((acc: number, app: any) => acc + (typeof app.score === 'number' ? app.score : 0), 0) / appreciations.length * 25).toFixed(1)) : 0
    };
  }; */

  // Handler export PDF rapport individuel
  const handleExportReport = async () => {
    if (!selectedCandidate) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('helvetica');
    // Titre principal coloré avec icône comme sur Auth
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Bleu
    // Ajout d'une icône utilisateur (fa-user-tie) en haut à gauche
    // (jsPDF ne supporte pas FontAwesome, on dessine un cercle bleu avec un pictogramme simple)
    doc.setFillColor(59, 130, 246);
    doc.circle(15, 15, 7, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(14);
    doc.text('👔', 12, 19); // Emoji cravate pour l'effet icône
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(24);
    doc.text('TheRecruit', 28, 22);
    doc.setTextColor(0, 0, 0); // Reset noir
    doc.setFontSize(16);
    let y = 33;
    doc.text(`Analyse Prédictive avec Appréciations RH`, 10, y); y += 8;
    doc.setFontSize(12);
    doc.text(`Poste : ${activeBrief?.title || 'N/A'}`, 10, y); y += 8;
    doc.text(`Score prédictif : ${selectedCandidate.predictive_score !== undefined ? Number(selectedCandidate.predictive_score).toFixed(1) : 'N/A'}/100`, 10, y); y += 8;
    doc.text('Appréciations RH :', 10, y); y += 8;
    if (Array.isArray(selectedCandidate.appreciations)) {
      selectedCandidate.appreciations.forEach((a: any, i: number) => {
        doc.text(`${a.question} (${a.category}) : ${a.appreciation} (${a.score * 25}/100)`, 12, y);
        y += 7;
        if (y > 270) { doc.addPage(); y = 15; }
      });
    }
    y += 4;
    doc.text('Scores radar :', 10, y); y += 7;
    // Ajout : export du radar chart en image
    if (radarRef.current && radarRef.current.getImageBase64) {
      const imgData = radarRef.current.getImageBase64();
      if (imgData) {
        doc.addImage(imgData, 'PNG', 10, y, 90, 90);
        y += 95;
      }
    }
    y += 4;
    doc.text('Risques identifiés :', 10, y); y += 7;
    if (Array.isArray(selectedCandidate.risks) && selectedCandidate.risks.length > 0) {
      selectedCandidate.risks.forEach((r: string) => {
        doc.text(`- ${r}`, 12, y); y += 7;
        if (y > 270) { doc.addPage(); y = 15; }
      });
    } else {
      doc.text('Aucun risque identifié', 12, y); y += 7;
    }
    y += 4;
    doc.text('Recommandations d’onboarding :', 10, y); y += 7;
    if (Array.isArray(selectedCandidate.recommendations) && selectedCandidate.recommendations.length > 0) {
      selectedCandidate.recommendations.forEach((rec: any) => {
        doc.text(`- ${rec}`, 12, y); y += 7;
        if (y > 270) { doc.addPage(); y = 15; }
      });
    } else {
      doc.text('Aucune recommandation', 12, y); y += 7;
    }
    // Signature en bas de page
    doc.setFontSize(10);
    doc.setTextColor(59, 130, 246); // Bleu
    doc.text('👔 TheRecruit', 10, 285);
    doc.setTextColor(0, 0, 0);
    doc.save(`Rapport_Predictif_${selectedCandidate.name}.pdf`);
  };

  // Charger dynamiquement les contextes d'entreprise
  const fetchContexts = async () => {
    const res = await companyContextService.getContexts();
    if (res.data) setContexts(res.data);
  };
  useEffect(() => {
    fetchContexts();
  }, []);

  // Fonction utilitaire pour obtenir les 5 scores détaillés avec provenance
  function getDetailedScores(candidate: Candidate) {
    const ca: any = candidate.cv_analysis || {};
    const scoreDetails: any = candidate.score_details || {};
    const appreciations = Array.isArray(candidate.appreciations) ? candidate.appreciations : [];
    
    return [
      {
        label: 'Compétences',
        value: typeof scoreDetails.skills_score === 'number' 
          ? Number(scoreDetails.skills_score.toFixed(1))
          : (typeof ca.score === 'number' ? Number(ca.score.toFixed(1)) : 0),
        provenance: scoreDetails.skills_score !== undefined ? 'Backend' : (ca.score !== undefined ? 'CV' : 'N/A'),
      },
      {
        label: 'Expérience',
        value: typeof scoreDetails.experience_score === 'number'
          ? Number(scoreDetails.experience_score.toFixed(1))
          : (Array.isArray(ca.experience) ? Number(Math.min(ca.experience.length * 20, 100).toFixed(1)) : 0),
        provenance: scoreDetails.experience_score !== undefined ? 'Backend' : (Array.isArray(ca.experience) ? 'CV' : 'N/A'),
      },
      {
        label: 'Formation',
        value: typeof scoreDetails.education_score === 'number'
          ? Number(scoreDetails.education_score.toFixed(1))
          : (Array.isArray(ca.education) ? Number(Math.min(ca.education.length * 25, 100).toFixed(1)) : 0),
        provenance: scoreDetails.education_score !== undefined ? 'Backend' : (Array.isArray(ca.education) ? 'CV' : 'N/A'),
      },
      {
        label: 'Culture',
        value: typeof scoreDetails.culture_score === 'number'
          ? Number(scoreDetails.culture_score.toFixed(1))
          : (typeof candidate.culture_score === 'number' ? Number(candidate.culture_score.toFixed(1)) : 0),
        provenance: scoreDetails.culture_score !== undefined || candidate.culture_score !== undefined ? 'Backend' : 'N/A',
      },
      {
        label: 'Entretien',
        value: typeof scoreDetails.interview_score === 'number'
          ? Number(scoreDetails.interview_score.toFixed(1))
          : (typeof candidate.interview_score === 'number' 
              ? Number(candidate.interview_score.toFixed(1))
              : (appreciations.length > 0
                  ? Number((appreciations.reduce((acc: number, app: any) => acc + (typeof app.score === 'number' ? app.score : 0), 0) / appreciations.length * 25).toFixed(1))
                  : 0)),
        provenance: scoreDetails.interview_score !== undefined || candidate.interview_score !== undefined ? 'Backend' : (appreciations.length > 0 ? 'Calc' : 'N/A'),
      },
    ];
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard RH</h1>
          <p className="text-gray-600">Gestion du processus de recrutement</p>
        </div>

        <BriefSelector
          activeBrief={activeBrief}
          onBriefChange={onBriefChange}
          briefs={briefs}
        />

        {/* Section de comparaison interactive */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📊</span>
              Comparaison interactive des candidats
            </h2>
            <div className="flex items-center space-x-3">
              <Button
                variant={showComparison ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? 'Masquer' : 'Afficher'} la comparaison
              </Button>
              {selectedForComparison.size > 0 && (
                <Button variant="ghost" size="sm" onClick={clearComparison}>
                  Effacer ({selectedForComparison.size})
                </Button>
              )}
            </div>
          </div>

          {showComparison && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Sélectionnez jusqu'à 5 candidats pour les comparer sur le radar. 
                Candidats sélectionnés : {selectedForComparison.size}/5
              </p>
              
              {/* Liste des candidats avec cases à cocher */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedForComparison.has(candidate.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleCandidateComparison(candidate.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedForComparison.has(candidate.id)}
                        onChange={() => toggleCandidateComparison(candidate.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {candidate.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Score: {getDisplayScore(candidate).displayScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Radar comparatif */}
              {comparisonRadarData.length >= 2 && (
                <div className="mt-6">
                  <RadarChart 
                    data={comparisonRadarData} 
                    title={`Comparaison de ${comparisonRadarData.length} candidats`}
                  />
                </div>
              )}

              {comparisonRadarData.length === 1 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">Sélectionnez au moins 2 candidats pour voir la comparaison</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Section radar comparatif multi-candidats */}
        {radarDatasets.length > 1 && (
          <div className="mb-10">
            <RadarChart data={radarDatasets} title="Comparatif multi-candidats (évalués pour ce brief)" />
          </div>
        )}

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidates List */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidats</h2>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={filter === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={filter === 'recommended' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('recommended')}
                >
                  Recommandés
                </Button>
                <Button
                  variant={filter === 'evaluation' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('evaluation')}
                >
                  En évaluation
                </Button>
                <Button
                  variant={filter === 'review' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('review')}
                >
                  À revoir
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onClick={() => setSelectedCandidate(candidate)}
                    isSelected={selectedCandidate?.id === candidate.id}
                  />
                ))
              ) : (
                <Card className="p-6 text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun candidat</h3>
                  <p className="text-gray-600">Téléchargez des CV pour voir les candidats ici</p>
                </Card>
              )}
            </div>
          </div>

          {/* Candidate Details */}
          <div className="lg:col-span-2">
            {selectedCandidate ? (
              <div className="space-y-6">
                {/* Header */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      
                      <p className="text-gray-600 mt-2">
                        {(() => {
                          const { displayScore, scoreLabel } = getDisplayScore && selectedCandidate ? getDisplayScore(selectedCandidate) : { displayScore: 0, scoreLabel: 'Score' };
                          return (
                            <>
                              {scoreLabel}: <span className="font-semibold text-blue-600">{displayScore}%</span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCandidate.status === 'Recommandé' ? 'bg-green-100 text-green-800' :
                      selectedCandidate.status === 'En évaluation' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedCandidate.status}
                    </span>
                  </div>
                </Card>

                {/* Radar Chart */}
                {(() => {
                  // Radar chart : même logique que la card, provenance harmonisée
                  const axes = ['Compétences', 'Expérience', 'Formation', 'Entretien', 'Culture'];
                  const values = getDetailedScores(selectedCandidate).reduce((acc, { label, value }) => {
                    acc[label] = value;
                    return acc;
                  }, {} as Record<string, number>);
                  const safeRadarData = [{ name: selectedCandidate?.name || 'Candidat', values, color: '#3b82f6' }];
                  return (
                    <RadarChart 
                      ref={radarRef}
                      data={safeRadarData}
                      title="Profil de Compétences (5 axes)"
                      axes={axes}
                      polygon={true}
                    />
                  );
                })()}

                {/* Risks & Recommendations robustes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risks */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Risques Identifiés
                    </h3>
                    <div className="space-y-2">
                      {Array.isArray(selectedCandidate.risks) && selectedCandidate.risks.length > 0 ? (
                        selectedCandidate.risks.map((risk, index) =>
                          risk == null ? null : (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{
                                (() => {
                                  if (risk == null) return '';
                                  const safeRisk = risk;
                                  if (typeof safeRisk === 'object' && 'description' in safeRisk && (safeRisk as any).description != null) {
                                    return String((safeRisk as any).description!);
                                  }
                                  return String(safeRisk!);
                                })()
                              }</span>
                            </div>
                          )
                        )
                      ) : generateRisksAndRecommendations(selectedCandidate).risks.length > 0 ? (
                        generateRisksAndRecommendations(selectedCandidate).risks.map((risk, index) =>
                          risk == null ? null : (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{
                                (() => {
                                  if (risk == null) return '';
                                  const safeRisk = risk;
                                  if (typeof safeRisk === 'object' && 'description' in safeRisk && safeRisk.description != null) {
                                    return String(safeRisk.description);
                                  }
                                  return String(safeRisk);
                                })()
                              }</span>
                            </div>
                          )
                        )
                      ) : (
                        <span className="text-sm text-gray-400">Aucun risque identifié</span>
                      )}
                    </div>
                  </Card>

                  {/* Recommendations */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">💡</span>
                      Recommandations
                    </h3>
                    <div className="space-y-2">
                      {Array.isArray(selectedCandidate.recommendations) && selectedCandidate.recommendations.length > 0 ? (
                        selectedCandidate.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{typeof rec === 'object' && rec !== null ? rec.description : rec}</span>
                          </div>
                        ))
                      ) : generateRisksAndRecommendations(selectedCandidate).recommendations.length > 0 ? (
                        generateRisksAndRecommendations(selectedCandidate).recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{typeof rec === 'object' && rec !== null ? rec.description : rec}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Aucune recommandation</span>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Valider le candidat</Button>
                    <Button variant="secondary">Replanifier entretien</Button>
                    <Button variant="outline" onClick={handleExportReport}>Exporter le rapport</Button>
                    <Button variant="ghost">Ajouter des notes</Button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un candidat</h3>
                <p className="text-gray-600">Choisissez un candidat dans la liste pour voir ses détails</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// Correction JSX : toutes les balises sont maintenant correctement fermées et les parenthèses/expressions sont équilibrées.
// (Aucune modification de logique métier, uniquement robustesse JSX)

// Affichage explicite des 5 scores détaillés dans la card du candidat, avec leur provenance (CV ou backend) sous chaque score.
