import React, { useState, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import CVBarChart from '../components/CVBarChart';
import CandidateDropdown from '../components/CandidateDropdown';
import BriefSelector from '../components/BriefSelector';
import ContextSelector, { CompanyContextType } from '../components/ContextSelector';
import { cvService, candidateService, companyContextService } from '../services/api';
import { JobBrief, Candidate } from '../services/api';
import { useCompanyContext } from '../context/CompanyContext';

interface CVProps {
  activeBrief: JobBrief | null;
  onBriefChange: (brief: JobBrief | null) => void;
  briefs: JobBrief[];
  setBriefs: (briefs: JobBrief[]) => void;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
}

// Filtrage des candidats par brief actif (utilitaire)
function filterCandidatesByBrief(candidates: Candidate[], brief: JobBrief | null) {
  return brief ? candidates.filter(c => c.brief_id === brief.id) : candidates;
}

interface AnalysisResult {
  name: string;
  experience: string;
  education: string;
  skills: string[];
  scores: {
    skills: number;
    experience: number;
    education: number;
  };
  report_summary?: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const CV: React.FC<CVProps> = ({ activeBrief, onBriefChange, briefs, setBriefs, candidates, setCandidates }) => {
  const { companyContext } = useCompanyContext();
  const [contexts, setContexts] = useState<CompanyContextType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!activeBrief) {
      setToast({ message: 'Veuillez d’abord sélectionner un brief de poste avant d’analyser un CV.', type: 'error' });
      return;
    }
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: 'Seuls les fichiers PDF et TXT sont acceptés', type: 'error' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Le fichier ne doit pas dépasser 5MB', type: 'error' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Préparer l’envoi du fichier + brief_id
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brief_id', String(activeBrief.id)); // <-- Assure-toi que activeBrief est bien défini
      // Upload et récupération de l'analyse IA
      const response = await cvService.uploadCV(formData);
      if (response.candidate) {
        // Affichage immédiat de l’analyse IA et du score
        setAnalysisResult({
          name: response.candidate.name,
          experience: response.candidate.cv_analysis?.["Expériences professionnelles"]?.map((e: any) => e.poste || '').join(', ') || 'Non renseigné',
          education: response.candidate.cv_analysis?.["Formations"]?.map((f: any) => f.diplôme || '').join(', ') || 'Non renseigné',
          skills: response.candidate.cv_analysis?.["Compétences"] || [],
          scores: {
            skills: response.candidate.score_details?.skills_score !== undefined ? Number(response.candidate.score_details.skills_score.toFixed(1)) : 0,
            experience: response.candidate.score_details?.experience_score !== undefined ? Number(response.candidate.score_details.experience_score.toFixed(1)) : 0,
            education: response.candidate.score_details?.education_score !== undefined ? Number(response.candidate.score_details.education_score.toFixed(1)) : 0
          },
          report_summary: response.candidate.report_summary || ''
        });
        
        // Rafraîchir la liste des candidats si besoin
        console.log('🔄 Rafraîchissement de la liste des candidats...');
        const candidatesResponse = await candidateService.getCandidates();
        console.log('📋 Réponse candidats:', candidatesResponse);
        
        if (candidatesResponse.data) {
          console.log('👥 Candidats reçus:', candidatesResponse.data.length);
          console.log('📋 Brief actif:', activeBrief?.id);
          
          setCandidates(candidatesResponse.data);
          
          // Debug: vérifier le filtrage
          const filtered = filterCandidatesByBrief(candidatesResponse.data, activeBrief);
          console.log('🎯 Candidats filtrés pour ce brief:', filtered.length);
          console.log('📋 Candidats filtrés détails:', filtered.map(c => ({ id: c.id, name: c.name, brief_id: c.brief_id })));
        }
        
        setToast({ message: 'CV analysé avec succès !', type: 'success' });
      } else {
        setToast({ message: response.error || 'Erreur lors de l\'analyse du CV', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse du CV:', error);
      setToast({ message: 'Erreur lors de l\'analyse du CV', type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Satisfaisant';
    return 'À améliorer';
  };

  // Filtrer les candidats selon le brief actif (mémorisé)
  const filteredCandidates = React.useMemo(() => {
    const filtered = filterCandidatesByBrief(candidates, activeBrief);
    console.log('🎯 useMemo filteredCandidates:', {
      totalCandidates: candidates.length,
      activeBrief: activeBrief?.id,
      filteredCount: filtered.length,
      filtered: filtered.map(c => ({ id: c.id, name: c.name, brief_id: c.brief_id }))
    });
    return filtered;
  }, [candidates, activeBrief]);

  // Mapping universel des scores pour compatibilité backend
  const mapScores = (raw: any) => {
    if (!raw) return { skills: 0, experience: 0, education: 0, global: 0 };
    return {
      skills: raw.skills_score ?? raw.skills ?? 0,
      experience: raw.experience_score ?? raw.experience ?? 0,
      education: raw.education_score ?? raw.education ?? 0,
      global: raw.final_score ?? raw.global ?? raw.score ?? 0
    };
  };

  // Mettre à jour analysisResult quand un candidat est sélectionné
  React.useEffect(() => {
    if (selectedCandidateId) {
      const candidate = filteredCandidates.find(c => c.id === selectedCandidateId);
      if (candidate) {
        // Utiliser score_details si présent, sinon fallback sur l’ancien mapping
        const rawScores = candidate.score_details || candidate.score || {
          skills_score: candidate.predictive_score || 0,
          experience_score: 0,
          education_score: 0,
          final_score: candidate.predictive_score || 0
        };
        const scores = mapScores(rawScores);
        setAnalysisResult({
          name: candidate.name,
          experience: candidate.cv_analysis?.["Expériences professionnelles"]?.map((e: any) => e.poste || '').join(', ') || 'Non renseigné',
          education: candidate.cv_analysis?.["Formations"]?.map((f: any) => f.diplôme || '').join(', ') || 'Non renseigné',
          skills: candidate.cv_analysis?.["Compétences"] || [],
          scores
        });
      }
    } else {
      setAnalysisResult(null);
    }
  }, [selectedCandidateId, filteredCandidates]);

  // Récupérer le brief actif à chaque upload ou changement
  React.useEffect(() => {
    if (activeBrief && activeBrief.id) {
      // Appel API pour récupérer les infos du brief actif si besoin
      // Exemple :
      // jobService.getBriefById(activeBrief.id).then(res => setBriefDetails(res.data));
      // Ici, tu peux stocker le brief dans un state local si tu veux l'afficher ou l'utiliser
    }
  }, [activeBrief]);

  // Lors du changement de brief actif, réinitialiser la sélection de candidat
  React.useEffect(() => {
    setSelectedCandidateId(null);
    setAnalysisResult(null);
  }, [activeBrief]);

  // Suppression d'un candidat
  const handleDeleteCandidate = async (id: number) => {
    if (!window.confirm('Supprimer ce CV ? Cette action est irréversible.')) return;
    try {
      const response = await candidateService.deleteCandidate(id);
      if (response.error) {
        setToast({ message: response.error, type: 'error' });
      } else {
        setToast({ message: 'CV supprimé avec succès', type: 'success' });
        // Rafraîchir la liste
        const candidatesResponse = await candidateService.getCandidates();
        if (candidatesResponse.data) {
          setCandidates(candidatesResponse.data);
        }
        // Désélectionner si le candidat supprimé était sélectionné
        if (selectedCandidateId === id) setSelectedCandidateId(null);
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  // Charger dynamiquement les contextes d'entreprise
  const fetchContexts = async () => {
    const res = await companyContextService.getContexts();
    if (res.data) setContexts(res.data);
  };
  React.useEffect(() => {
    fetchContexts();
  }, []);

  // Debug function pour tester l'API candidats
  const debugCandidates = async () => {
    console.log('🔍 Debug: Test API /candidates');
    try {
      const response = await candidateService.getCandidates();
      console.log('📋 Debug - Réponse brute candidats:', response);
      console.log('📋 Debug - Candidats data:', response.data);
      console.log('📋 Debug - Nombre de candidats:', response.data?.length || 0);
      if (response.data) {
        response.data.forEach((c, index) => {
          console.log(`📋 Debug - Candidat ${index}:`, {
            id: c.id,
            name: c.name,
            brief_id: c.brief_id,
            user_id: c.user_id,
            status: c.status
          });
        });
      }
    } catch (error) {
      console.error('❌ Debug - Erreur API candidats:', error);
    }
  };

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
        {/* Sélecteur de brief actif */}
        <BriefSelector
          activeBrief={activeBrief}
          onBriefChange={onBriefChange}
          briefs={briefs}
        />
        {/* Dropdown de sélection de candidat */}
        <CandidateDropdown
          candidates={filteredCandidates}
          selectedCandidateId={selectedCandidateId}
          onSelect={setSelectedCandidateId}
        />
        
        {/* Debug button temporaire */}
        <div className="mb-4">
          <button 
            onClick={debugCandidates}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          >
            🔍 Debug: Tester API candidats
          </button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyse de CV</h1>
          <p className="text-gray-600">Téléchargez un CV pour une analyse automatique des compétences et de l'expérience</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Téléchargement du CV</h2>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-6xl">📄</div>
                
                {isAnalyzing ? (
                  <div className="space-y-3">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-600">Analyse du CV en cours...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Glissez-déposez votre CV ici
                      </p>
                      <p className="text-gray-600 mb-4">ou cliquez pour sélectionner</p>
                      <p className="text-sm text-gray-500">PDF ou TXT • Max 5MB</p>
                    </div>
                    
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileInput}
                      className="hidden"
                      id="cv-upload"
                      ref={fileInputRef}
                    />
                    <Button
                      variant="primary"
                      size="lg"
                      className="cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                    >
                      Sélectionner un fichier
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <h3 className="font-medium mb-2">Informations analysées :</h3>
              <ul className="space-y-1">
                <li>• Compétences techniques et soft skills</li>
                <li>• Expérience professionnelle</li>
                <li>• Formation et certifications</li>
                <li>• Adéquation avec le poste</li>
              </ul>
            </div>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {analysisResult ? (
              <>
        

                {/* Candidate Info */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations Candidat</h2>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Nom :</span>
                      <span className="ml-2 text-gray-900">{analysisResult.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expérience :</span>
                      <span className="ml-2 text-gray-900">{analysisResult.experience}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Formation :</span>
                      <span className="ml-2 text-gray-900">{analysisResult.education}</span>
                    </div>
                  </div>
                </Card>

                {/* Skills */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Compétences Détectées</h2>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Scores */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Scores d'Évaluation</h2>
                  <div className="space-y-4">
                    {Object.entries(analysisResult.scores).map(([category, score]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700 capitalize">
                            {category === 'skills' ? 'Compétences' : 
                             category === 'experience' ? 'Expérience' : 'Formation'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
                              {score}%
                            </span>
                            <span className="text-sm text-gray-500">
                              {getScoreLabel(score)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              score >= 80 ? 'bg-green-500' : 
                              score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{width: `${score}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
 {/* Bar chart des scores */}
                <CVBarChart
                  scores={{
                    skills: Number(analysisResult.scores.skills) || 0,
                    experience: Number(analysisResult.scores.experience) || 0,
                    education: Number(analysisResult.scores.education) || 0,
                    global: Number(
                      Math.round(
                        (Number(analysisResult.scores.skills) * 0.5 +
                         Number(analysisResult.scores.experience) * 0.3 +
                         Number(analysisResult.scores.education) * 0.2)
                      )
                    ) || 0,
                  }}
                />
                {/* Résumé */}
                {analysisResult?.report_summary && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Résumé</h2>
                    <div className="prose max-w-none">
                      <pre style={{whiteSpace: 'pre-wrap'}}>{analysisResult.report_summary}</pre>
                    </div>
                  </Card>
                )}

                {/* Actions */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Valider l'analyse</Button>
                    <Button variant="secondary" onClick={async () => {
                      if (!selectedCandidateId) return;
                      const candidate = filteredCandidates.find(c => c.id === selectedCandidateId);
                      if (!candidate) return;
                      try {
                        await candidateService.exportCandidateReport(candidate.id, candidate.name);
                        setToast({ message: 'Rapport PDF exporté avec succès !', type: 'success' });
                      } catch (e: any) {
                        setToast({ message: e.message || 'Erreur lors de l\'export PDF', type: 'error' });
                      }
                    }}>Exporter le rapport</Button>
                    <Button variant="outline" onClick={async () => {
                      if (!selectedCandidateId) return;
                      const candidate = filteredCandidates.find(c => c.id === selectedCandidateId);
                      if (!candidate) return;
                      try {
                        await candidateService.copyCandidateToClipboard(candidate);
                        setToast({ message: 'Rapport copié dans le presse-papiers !', type: 'success' });
                      } catch (e: any) {
                        setToast({ message: e.message || 'Erreur lors de la copie', type: 'error' });
                      }
                    }}>Copier le rapport</Button>
                    <Button variant="outline" onClick={() => handleDeleteCandidate(selectedCandidateId!)} disabled={!selectedCandidateId}>
                      Supprimer ce CV
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun CV analysé</h3>
                <p className="text-gray-600">Téléchargez un CV pour voir l'analyse détaillée</p>
              </Card>
            )}
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
    </div>
  );
};

export default CV;
