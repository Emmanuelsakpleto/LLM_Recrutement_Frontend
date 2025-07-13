import React, { useState, useEffect, useRef } from 'react';
import CandidateCard from '../components/CandidateCard';
import RadarChart from '../components/RadarChart';
import Card from '../components/Card';
import Button from '../components/Button';
import BriefSelector from '../components/BriefSelector';
import ContextSelector from '../components/ContextSelector';
import { candidateService, JobBrief, Candidate, companyContextService, CompanyContextType } from '../services/api';
import { filterCandidatesByBrief } from '../lib/utils';
import { useCompanyContext } from '../context/CompanyContext';
import { useNavigate } from 'react-router-dom';

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
  const [showComparison, setShowComparison] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<number>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radarRef = useRef<any>(null);

  const filteredByBrief = filterCandidatesByBrief(candidates, activeBrief);

  // Sélectionner le premier candidat du brief actif par défaut
  useEffect(() => {
    if (filteredByBrief.length > 0 && !selectedCandidate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const COLORS = [
    '#3b82f6', // bleu
    '#ef4444', // rouge
    '#10b981', // vert
    '#f59e42', // orange
    '#a855f7', // violet
    '#6366f1', // indigo
    '#f43f5e', // rose
  ];

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
  const evaluatedCandidates = filteredByBrief.filter(c => ['En évaluation', 'Recommandé'].includes(c.status));

  // Fonction pour normaliser un score (gérer les cas 0-1 et 0-100)
  const normalizeScore = (score: number): number => {
    if (score === null || score === undefined || isNaN(score)) return 0;
    // Si le score est entre 0 et 1, on le convertit en pourcentage
    if (score <= 1) return Number((score * 100).toFixed(1));
    // Si le score est déjà en pourcentage (0-100), on le garde tel quel
    return Number(score.toFixed(1));
  };

  // Fonction pour obtenir les données radar d'un candidat avec priorité aux champs de base de données
  const getRadarDataFromBackend = (candidate: Candidate) => {
    // Utiliser exactement la même logique que CandidateCard pour garantir la cohérence
    const cand: any = candidate;
    
    // Priorité aux champs directs de la base de données avec normalisation
    const skillsScore = cand.skills_score !== undefined && cand.skills_score !== null
      ? normalizeScore(cand.skills_score)
      : (cand.score_details?.skills_score !== undefined ? normalizeScore(cand.score_details.skills_score) : 0);
      
    const experienceScore = cand.experience_score !== undefined && cand.experience_score !== null
      ? normalizeScore(cand.experience_score)
      : (cand.score_details?.experience_score !== undefined ? normalizeScore(cand.score_details.experience_score) : 0);
      
    const educationScore = cand.education_score !== undefined && cand.education_score !== null
      ? normalizeScore(cand.education_score)
      : (cand.score_details?.education_score !== undefined ? normalizeScore(cand.score_details.education_score) : 0);
      
    const cultureScore = cand.culture_score !== undefined && cand.culture_score !== null
      ? normalizeScore(cand.culture_score)
      : (cand.radar_data?.Culture !== undefined ? normalizeScore(cand.radar_data.Culture) : 0);
      
    const interviewScore = cand.interview_score !== undefined && cand.interview_score !== null
      ? normalizeScore(cand.interview_score)
      : (cand.radar_data?.Entretien !== undefined ? normalizeScore(cand.radar_data.Entretien) : 0);

    // Debug pour voir les vraies valeurs
    console.log(`Radar data for ${candidate.name}:`, {
      skillsScore, experienceScore, educationScore, cultureScore, interviewScore,
      raw: { 
        skills: cand.skills_score, 
        experience: cand.experience_score, 
        education: cand.education_score,
        culture: cand.culture_score,
        interview: cand.interview_score
      }
    });

    // Si on a au moins un score de base de données
    if (skillsScore > 0 || experienceScore > 0 || educationScore > 0 || cultureScore > 0 || interviewScore > 0) {
      return {
        'Compétences': skillsScore,
        'Expérience': experienceScore,
        'Formation': educationScore,
        'Culture': cultureScore,
        'Entretien': interviewScore
      };
    }
    
    // Fallback : utiliser radar_data si aucun score direct n'est disponible
    if (candidate && candidate.radar_data) {
      const radar = candidate.radar_data;
      return {
        'Compétences': typeof radar['Compétences'] === 'number' ? normalizeScore(radar['Compétences']) : 0,
        'Expérience': typeof radar['Expérience'] === 'number' ? normalizeScore(radar['Expérience']) : 0,
        'Formation': typeof radar['Formation'] === 'number' ? normalizeScore(radar['Formation']) : 0,
        'Culture': typeof radar['Culture'] === 'number' ? normalizeScore(radar['Culture']) : 0,
        'Entretien': typeof radar['Entretien'] === 'number' ? normalizeScore(radar['Entretien']) : 0
      };
    }
    
    // Dernier fallback : ancienne logique locale avec conversion pour cohérence
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

  const radarDatasets = evaluatedCandidates.map((c, i) => {
    return {
      name: c.name,
      color: COLORS[i % COLORS.length],
      values: getRadarDataFromBackend(c)
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
    // Ajout : export du radar chart en image
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
    doc.text('Recommandations d\'onboarding :', 10, y); y += 7;
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
    try {
      const res = await companyContextService.getContexts();
      if (res.data) setContexts(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des contextes:', error);
    }
  };

  useEffect(() => {
    fetchContexts();
  }, []);

  // Fonction utilitaire pour obtenir les 5 scores détaillés avec provenance
  function getDetailedScores(candidate: Candidate) {
    const ca: any = candidate.cv_analysis || {};
    const cand: any = candidate;
    const scoreDetails = cand.score_details || {};
    const appreciations = Array.isArray(candidate.appreciations) ? candidate.appreciations : [];
    
    return [
      {
        label: 'Compétences',
        value: typeof scoreDetails.skills_score === 'number' 
          ? normalizeScore(scoreDetails.skills_score)
          : (typeof ca.score === 'number' ? Number(ca.score.toFixed(1)) : 0),
        provenance: scoreDetails.skills_score !== undefined ? 'Backend' : (ca.score !== undefined ? 'CV' : 'N/A'),
      },
      {
        label: 'Expérience',
        value: typeof scoreDetails.experience_score === 'number'
          ? normalizeScore(scoreDetails.experience_score)
          : (Array.isArray(ca.experience) ? Number(Math.min(ca.experience.length * 20, 100).toFixed(1)) : 0),
        provenance: scoreDetails.experience_score !== undefined ? 'Backend' : (Array.isArray(ca.experience) ? 'CV' : 'N/A'),
      },
      {
        label: 'Formation',
        value: typeof scoreDetails.education_score === 'number'
          ? normalizeScore(scoreDetails.education_score)
          : (Array.isArray(ca.education) ? Number(Math.min(ca.education.length * 25, 100).toFixed(1)) : 0),
        provenance: scoreDetails.education_score !== undefined ? 'Backend' : (Array.isArray(ca.education) ? 'CV' : 'N/A'),
      },
      {
        label: 'Culture',
        value: typeof scoreDetails.culture_score === 'number'
          ? normalizeScore(scoreDetails.culture_score)
          : (typeof candidate.predictive_score === 'number' ? Number(candidate.predictive_score.toFixed(1)) : 0),
        provenance: scoreDetails.culture_score !== undefined ? 'Backend' : (typeof candidate.predictive_score === 'number' ? 'CV' : 'N/A'),
      },
      {
        label: 'Entretien',
        value: typeof scoreDetails.interview_score === 'number'
          ? normalizeScore(scoreDetails.interview_score)
          : (appreciations.length > 0
              ? Number((appreciations.reduce((acc: number, app: any) => acc + (typeof app.score === 'number' ? app.score : 0), 0) / appreciations.length * 25).toFixed(1))
              : 0),
        provenance: scoreDetails.interview_score !== undefined ? 'Backend' : (appreciations.length > 0 ? 'Calc' : 'N/A'),
      },
    ];
  }

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleContextChange = (context: CompanyContextType | null) => {
    if (!context) return;
    navigate('/context', { state: { context } });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Sélecteur de contexte d'entreprise en tout premier */}
        <ContextSelector 
          contexts={contexts} 
          onContextsChange={fetchContexts}
        />
        
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
                    onClick={() => toggleCandidateComparison(candidate.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedForComparison.has(candidate.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedForComparison.has(candidate.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">{candidate.name}</span>
                      <span className="text-sm text-gray-500">({candidate.status})</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Radar comparatif */}
              {comparisonRadarData.length >= 2 && (
                <div className="mt-6">
                  <RadarChart 
                    data={comparisonRadarData}
                    axes={['Compétences', 'Expérience', 'Formation', 'Culture', 'Entretien']}
                    size={400}
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
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Comparatif multi-candidats (évalués pour ce brief)
              </h2>
              <RadarChart 
                data={radarDatasets} 
                axes={['Compétences', 'Expérience', 'Formation', 'Culture', 'Entretien']}
                size={400}
              />
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Légende :</h4>
                <div className="flex flex-wrap gap-4">
                  {radarDatasets.map((dataset, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: dataset.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{dataset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
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
                  <div 
                    key={candidate.id}
                    onClick={() => handleCandidateClick(candidate)}
                    className={`cursor-pointer transition-all duration-200 ${selectedCandidate?.id === candidate.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <CandidateCard 
                      candidate={candidate}
                      isSelected={selectedCandidate?.id === candidate.id}
                    />
                  </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCandidate.name}</h3>
                    <Button variant="outline" size="sm" onClick={handleExportReport}>
                      📄 Exporter PDF
                    </Button>
                  </div>
                  
                  {/* Scores détaillés */}
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {getDetailedScores(selectedCandidate).map((score, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {score.value}
                        </div>
                        <div className="text-xs text-gray-500">{score.label}</div>
                        <div className="text-xs text-gray-400">({score.provenance})</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Radar Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Profil Radar - {selectedCandidate.name}</h3>
                  {(() => {
                    // Radar chart : utiliser la même logique que les cartes et le radar comparatif
                    const axes = ['Compétences', 'Expérience', 'Formation', 'Culture', 'Entretien'];
                    
                    // Utiliser la même fonction getRadarDataFromBackend pour cohérence
                    const radarValues = getRadarDataFromBackend(selectedCandidate);
                    
                    const data = {
                      name: selectedCandidate.name,
                      color: '#3b82f6',
                      values: radarValues
                    };

                    console.log('Radar Data for', selectedCandidate.name, ':', data);

                    return (
                      <RadarChart
                        ref={radarRef}
                        data={[data]}
                        axes={axes}
                        size={300}
                      />
                    );
                  })()}
                </Card>

                {/* Risks & Recommendations robustes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(() => {
                    const { risks, recommendations } = generateRisksAndRecommendations(selectedCandidate);
                    
                    return (
                      <>
                        {risks.length > 0 && (
                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-3 text-red-700">Risques identifiés</h3>
                            <ul className="space-y-2">
                              {risks.map((risk, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-1">⚠️</span>
                                  <span className="text-sm text-gray-700">{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </Card>
                        )}

                        {recommendations.length > 0 && (
                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-3 text-green-700">Recommandations</h3>
                            <ul className="space-y-2">
                              {recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">💡</span>
                                  <span className="text-sm text-gray-700">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </Card>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="flex gap-3">
                    <Button 
                      variant="primary"
                      onClick={() => navigate(`/evaluation/${selectedCandidate.id}`)}
                    >
                      Évaluer le candidat
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/interview/${selectedCandidate.id}`)}
                    >
                      Programmer un entretien
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/cv/${selectedCandidate.id}`)}
                    >
                      Voir le CV détaillé
                    </Button>
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
