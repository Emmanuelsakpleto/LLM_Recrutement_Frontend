// Configuration et services API pour TheRecruit - Version améliorée
const API_BASE_URL = 'http://localhost:5000/api';

// Types d'API basés sur votre backend (inchangés)
export interface User { id: number; username: string; email: string; }
export interface JobBrief {
  date: string;
  department: string;
  location: string;
  contractType: string; id: number; title: string; skills: string[]; experience: string; description: string; full_data?: { title: string; description: string; skills: string[]; responsibilities: string[]; qualifications: string[]; required_experience_years: number; required_degree: string; }; created_at: string; updated_at: string; status: string; 
}
export interface CVAnalysis {
  competences: any;
  score?: number;
  experience?: any[];
  education?: any[];
  // autres propriétés si besoin
}
export interface InterviewQuestion { id: number; question: string; category: string; purpose: string; }
export interface PredictiveAnalysis { predictive_score: number; strengths: string[]; weaknesses: string[]; recommendations: string[]; }
export interface Appreciation {
  score: number;
  // autres propriétés si besoin
}
export interface Candidate {
  score: any;
  score_details?: {
    final_score?: number;
    skills_score?: number;
    experience_score?: number;
    education_score?: number;
    // autres propriétés si besoin
  } | null;
  id: number;
  name: string;
  cv_analysis?: CVAnalysis;
  predictive_score?: number;
  appreciations?: Appreciation[];
  status: string;
  report_summary?: string; // <-- Ajouté pour corriger l'erreur de typage
  interview_questions?: any[] | string; // Ajout pour corriger l'accès dans Evaluation.tsx
  brief_id?: number; // robustesse pour le filtrage par brief
  radar_data?: Record<string, number>; // Ajout pour dashboard/radar
  risks?: string[]; // Ajout pour dashboard
  recommendations?: any[]; // Ajout pour dashboard
  // autres propriétés existantes
}
export interface ApiResponse<T> { data?: T; message?: string; error?: string; status?: string; user?: User; token?: string; [key: string]: any; }
export interface AuthResponse { token: string; user: User; }

// Gestion du token JWT
class TokenManager {
  private static token: string | null = localStorage.getItem('jwt_token') || null; // Charger depuis localStorage au démarrage

  static getToken(): string | null {
    return this.token;
  }

  static setToken(token: string): void {
    this.token = token;
    localStorage.setItem('jwt_token', token); // Stocker dans localStorage
    console.log('🔑 Token stocké:', token.substring(0, 20) + '...');
  }

  static removeToken(): void {
    this.token = null;
    localStorage.removeItem('jwt_token'); // Supprimer de localStorage
    console.log('🗑️ Token supprimé');
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ Aucun token JWT disponible. Authentification requise.');
    }
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
    console.log('📋 Headers auth générés:', headers);
    return headers;
  }

  static getAuthHeadersMultipart(): HeadersInit {
    const token = this.getToken();
    // NE PAS inclure Content-Type ici !
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` })
    };
    console.log('📋 Headers multipart générés:', headers);
    return headers;
  }
}

// Fonction utilitaire pour les appels API
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    // Correction : n'ajouter Content-Type: application/json que si body n'est PAS un FormData
    let headers: HeadersInit = {};
    if (options.body instanceof FormData) {
      headers = {
        ...TokenManager.getAuthHeadersMultipart(),
        ...options.headers
      };
    } else {
      headers = {
        ...TokenManager.getAuthHeaders(),
        ...options.headers
      };
    }
    
    console.log('🌐 Appel API:', {
      url,
      method: options.method || 'GET',
      headers,
      body: options.body
    });
    console.log('🌐 Appel API URL:', url);
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'  // Ajouté pour gérer les cookies/authentification
    });

    console.log('📡 Réponse HTTP:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    const contentType = response.headers.get('content-type');
    console.log('📄 Type de contenu:', contentType);

    // Cas spécial pour les téléchargements de fichiers (PDF)
    if (contentType && contentType.includes('application/pdf')) {
      console.log('📥 Téléchargement de fichier PDF détecté');
      return { data: response as any }; // Retourne la réponse brute pour gestion manuelle
    }

    if (!contentType || !contentType.includes('application/json')) {
      console.log('⚠️ Réponse non-JSON détectée');
      if (!response.ok) {
        return { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
      }
      return { data: {} as T };
    }

    const textResponse = await response.text();
    console.log('📝 Réponse brute:', textResponse);

    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('📦 Données parsées:', data);
      // Correction : si la racine est un tableau, on l'enveloppe dans { data: ... }
      if (Array.isArray(data)) {
        return { data: data as T };
      }
    } catch (parseError) {
      console.error('❌ Erreur de parsing JSON:', parseError);
      return { error: 'Réponse serveur invalide (JSON malformé)' };
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Erreur HTTP ${response.status}`;
      console.log('❌ Erreur serveur:', errorMessage);
      return { error: errorMessage };
    }

    console.log('✅ Réponse API réussie:', data);
    return data;

  } catch (error) {
    console.error('💥 Erreur réseau/fetch:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.' };
    }
    
    return { error: `Erreur de connexion: ${error.message}` };
  }
}

// Services d'authentification
export const authService = {
  async register(userData: { username: string; email: string; password: string }): Promise<ApiResponse<{ message: string; user: User }>> {
    console.log('📝 Tentative d\'inscription:', { username: userData.username, email: userData.email });
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    console.log('🔐 Tentative de connexion pour:', credentials.email);
    
    const response = await apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log('🔍 Analyse de la réponse login:', response);

    let token = null;
    if (response.data && response.data.token) {
      token = response.data.token;
      console.log('🔑 Token trouvé dans data.token');
    } else if (response.token) {
      token = response.token;
      console.log('🔑 Token trouvé dans token');
    } else if (response.access_token) {
      token = response.access_token;
      console.log('🔑 Token trouvé dans access_token');
    }

    if (token) {
      TokenManager.setToken(token);
    } else {
      console.warn('⚠️ Aucun token trouvé dans la réponse login:', response);
    }

    return response;
  },

  async logout(): Promise<void> {
    console.log('🚪 Déconnexion en cours...');
    try {
      await apiCall('/auth/logout', { method: 'POST' });
      console.log('✅ Déconnexion côté serveur réussie');
    } catch (error) {
      console.warn('⚠️ Erreur lors de la déconnexion côté serveur:', error);
    } finally {
      TokenManager.removeToken();
    }
  },

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    console.log('👤 Récupération des informations utilisateur...');
    return apiCall('/auth/me');
  }
};

// Ajout dans api.ts après la définition de apiCall
async function apiCallWithRetry(endpoint: string, options: RequestInit = {}): Promise<any> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 seconde

  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Appel API (Tentative ${attempt}/${maxRetries}):`, { url, method: options.method, headers: options.headers, body: options.body });
      const response = await fetch(url, {
        ...options,
        credentials: options.method === 'GET' && endpoint.includes('/export-pdf') ? 'omit' : 'include', // Ajuster credentials
        headers: {
          ...TokenManager.getAuthHeaders(), // Inclure uniquement si nécessaire
          ...options.headers,
        },
      });

      console.log('📡 Statut de la réponse:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('💥 Erreur réseau/fetch:', error);
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
}

// Mise à jour de jobService.createBrief
export const jobService = {
  async createBrief(briefData: {
    title: string;
    skills: string[];
    experience: string;
    description: string;
  }): Promise<ApiResponse<JobBrief>> {
    return apiCallWithRetry('/job-briefs', {
      method: 'POST',
      body: JSON.stringify(briefData)
    });
  },

  async getBriefs(): Promise<ApiResponse<JobBrief[]>> {
    console.log('📋 Récupération des fiches de poste...');
    return apiCall<JobBrief[]>('/job-briefs');
  },

  async getBrief(id: number): Promise<ApiResponse<JobBrief>> {
    console.log('📋 Récupération de la fiche de poste:', id);
    return apiCall(`/job-briefs/${id}`);
  },

  async updateBrief(id: number, briefData: {
    title: string;
    skills: string[];
    experience: string;
    description: string;
  }): Promise<ApiResponse<JobBrief>> {
    console.log('📋 Mise à jour de la fiche de poste:', id, briefData);
    return apiCall(`/job-briefs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...briefData,
        regenerate_full_description: true
      })
    });
  },

  async deleteBrief(id: number): Promise<ApiResponse<{ message: string }>> {
    console.log('🗑️ Suppression de la fiche de poste:', id);
    return apiCall(`/job-briefs/${id}`, {
      method: 'DELETE',
    });
  },

  async exportBriefToPDF(brief: JobBrief): Promise<void> {
    console.log('📄 Tentative d\'export PDF de la fiche:', brief.title);

    if (!brief.full_data) {
      throw new Error('Données complètes manquantes pour la fiche de poste');
    }

    // Utiliser apiCall au lieu de apiCallWithRetry pour gérer correctement la réponse PDF
    const response = await apiCall<any>(`/job-briefs/${brief.id}/export-pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Cache-Control': 'no-cache',
      },
    });

    // Vérifier si la réponse contient les données (l'objet Response brut)
    if (response && response.data instanceof Response) {
      const blob = await response.data.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiche-${brief.id}-${brief.title.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      console.log('✅ Export PDF réussi');
    } else {
      // Gérer les cas où la réponse n'est pas l'objet Response attendu (par exemple, une erreur JSON)
      console.error('❌ Erreur lors de l\'export PDF:', response?.error || 'Réponse inattendue du serveur');
      throw new Error(response?.error || 'Erreur lors de la génération du PDF');
    }
  },

  async copyBriefToClipboard(brief: JobBrief): Promise<void> {
    try {
      let fullData: any = null;
      if (brief.full_data) {
        if (typeof brief.full_data === 'string') {
          try {
            fullData = JSON.parse(brief.full_data);
          } catch {
            fullData = null;
          }
        } else if (typeof brief.full_data === 'object') {
          fullData = brief.full_data;
        }
      }
      const skills = Array.isArray(brief.skills) ? brief.skills.join(', ') : (brief.skills ? String(brief.skills) : 'Non spécifié');
      const textToCopy = `
Titre: ${brief.title}
Expérience: ${brief.experience}
Compétences: ${skills}
Description: ${brief.description}
${fullData ? `
Responsabilités:
${Array.isArray(fullData.responsibilities) ? fullData.responsibilities.join('\n') : 'Non spécifié'}

Qualifications:
${Array.isArray(fullData.qualifications) ? fullData.qualifications.join('\n') : 'Non spécifié'}` : ''}
      `.trim();

      await navigator.clipboard.writeText(textToCopy);
      console.log('✅ Contenu copié dans le presse-papiers:', textToCopy);
    } catch (error) {
      console.error('❌ Erreur lors de la copie dans le presse-papiers:', error);
      throw new Error('Impossible de copier dans le presse-papiers');
    }
  },

  async checkPDFServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/pdf`, {
        method: 'GET',
        headers: TokenManager.getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Service PDF non disponible:', error);
      return false;
    }
  }
};


export const cvService = {
  async uploadCV(formData: FormData): Promise<ApiResponse<any>> {
    return apiCall('/cv/upload', {
      method: 'POST',
      body: formData,
      headers: TokenManager.getAuthHeadersMultipart(),
    });
  },
};

export const candidateService = {
  async getCandidates(): Promise<ApiResponse<Candidate[]>> {
    return apiCall('/candidates');
  },
  async deleteCandidate(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiCall(`/candidates/${id}`, {
      method: 'DELETE',
      headers: TokenManager.getAuthHeaders(),
    });
  },
  async exportCandidateReport(candidateId: number, candidateName: string): Promise<void> {
    const response = await apiCall<any>(`/candidates/${candidateId}/export-pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Cache-Control': 'no-cache'
      }
    });
    if (response && response.data instanceof Response) {
      const blob = await response.data.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-candidat-${candidateId}-${candidateName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      console.log('✅ Export PDF candidat réussi');
    } else {
      console.error('❌ Erreur lors de l\'export PDF candidat:', response?.error || 'Réponse inattendue du serveur');
      throw new Error(response?.error || 'Erreur lors de la génération du PDF candidat');
    }
  },

  async copyCandidateToClipboard(candidate: Candidate): Promise<void> {
    try {
      let cvData: any = candidate.cv_analysis;
      if (typeof cvData === 'string') {
        try { cvData = JSON.parse(cvData); } catch { cvData = {}; }
      }
      const scores = candidate.score_details || {};
      // Si le backend fournit un résumé markdown-like, on le privilégie
      if (candidate.report_summary) {
        await navigator.clipboard.writeText(candidate.report_summary);
        console.log('✅ Résumé markdown copié dans le presse-papiers:', candidate.report_summary);
        return;
      }
      const textToCopy = `
Nom: ${candidate.name}
Statut: ${candidate.status}

Compétences: ${(cvData["Compétences"] || []).join(', ')}
Expériences:
${(cvData["Expériences professionnelles"] || []).map((e: any) => `- ${e.poste || ''} chez ${e.entreprise || ''} (${e.durée || ''})`).join('\n')}
Formations:
${(cvData["Formations"] || []).map((f: any) => `- ${f.diplôme || ''} à ${f.institution || ''} (${f.année || ''})`).join('\n')}

Scores:
Compétences: ${scores.skills_score ?? 0}%
Expérience: ${scores.experience_score ?? 0}%
Formation: ${scores.education_score ?? 0}%
Score final: ${scores.final_score ?? 0}%
`;
      await navigator.clipboard.writeText(textToCopy);
      console.log('✅ Rapport candidat copié dans le presse-papiers:', textToCopy);
    } catch (error) {
      console.error('❌ Erreur lors de la copie du rapport candidat:', error);
      throw new Error('Impossible de copier le rapport candidat dans le presse-papiers');
    }
  },

  async submitEvaluation(candidateId: number, evaluationData: any): Promise<ApiResponse<any>> {
    console.log(`📊 Soumission de l'évaluation pour le candidat ${candidateId}`, evaluationData);
    return apiCall(`/candidates/${candidateId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  },

  // Nouvelles méthodes pour le processus de recrutement
  async generateInterviewQuestions(candidateId: number): Promise<ApiResponse<any>> {
    return apiCall(`/candidates/${candidateId}/generate-interview-questions`, {
      method: 'POST',
      headers: TokenManager.getAuthHeaders(),
    });
  },

  async evaluateInterview(candidateId: number, evaluations: any[]): Promise<ApiResponse<any>> {
    return apiCall(`/candidates/${candidateId}/evaluate-interview`, {
      method: 'POST',
      headers: TokenManager.getAuthHeaders(),
      body: JSON.stringify({ evaluations }),
    });
  },

  async finalizeEvaluation(candidateId: number): Promise<ApiResponse<any>> {
    return apiCall(`/candidates/${candidateId}/finalize-evaluation`, {
      method: 'POST',
      headers: TokenManager.getAuthHeaders(),
    });
  },

  async getCandidateStageInfo(candidateId: number): Promise<ApiResponse<any>> {
    return apiCall(`/candidates/${candidateId}/stage-info`, {
      method: 'GET',
      headers: TokenManager.getAuthHeaders(),
    });
  },
};

// Services pour les CV, contexte, évaluation, candidats (inchangés)
export const contextService = {
  generateQuestionsMarkdown(questions: InterviewQuestion[], briefTitle: string): string {
    let markdown = `### Questions d'Entretien pour le Poste de ${briefTitle}\n\n`;
    questions.forEach((q, i) => {
      markdown += `**Question ${i + 1} (${q.category})** : ${q.question}\n- *Objectif* : ${q.purpose}\n\n`;
    });
    return markdown;
  },
  async exportQuestionsToPDF(questions: InterviewQuestion[], briefTitle: string): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('helvetica'); // Correction police compatible accents
    doc.setFontSize(16);
    doc.text(`Questions d'entretien - ${briefTitle}`, 10, 15);
    doc.setFontSize(12);
    let y = 25;
    questions.forEach((q, i) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`Question ${i + 1} (${q.category})`, 10, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      // Gestion du retour à la ligne automatique pour les questions longues
      const splitQuestion = doc.splitTextToSize(q.question, 180);
      doc.text(splitQuestion, 15, y);
      y += splitQuestion.length * 6;
      if (q.purpose) {
        doc.setFontSize(10);
        const splitPurpose = doc.splitTextToSize(`Objectif : ${q.purpose}`, 170);
        doc.text(splitPurpose, 15, y);
        doc.setFontSize(12);
        y += splitPurpose.length * 5.5;
      }
      y += 3;
      if (y > 270) { doc.addPage(); y = 15; }
    });
    doc.save(`questions-entretien-${briefTitle.replace(/\s+/g, '-')}.pdf`);
  },
  async copyQuestionsToClipboard(questions: InterviewQuestion[], briefTitle: string): Promise<void> {
    // Génération d'un texte brut simple, pas de markdown
    let text = `Questions d'entretien pour le poste de ${briefTitle}\n\n`;
    questions.forEach((q, i) => {
      text += `Question ${i + 1} (${q.category}) : ${q.question}\n`;
      if (q.purpose) text += `Objectif : ${q.purpose}\n`;
      text += '\n';
    });
    await navigator.clipboard.writeText(text);
    console.log('✅ Questions copiées dans le presse-papiers (texte brut)');
  },
  async createContext({ values, culture, brief_id, candidate_id }: { values: string[]; culture: string; brief_id: number; candidate_id: number }): Promise<ApiResponse<{ questions: InterviewQuestion[] }>> {
    return apiCall('/context/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ values, culture, brief_id, candidate_id }),
      headers: TokenManager.getAuthHeaders(),
    });
  },
};

// --- Service contextes d'entreprise (CRUD) ---
export interface CompanyContextType {
  id?: number;
  nom_entreprise: string;
  domaine: string;
  values: string[];
  culture: string;
}

export const companyContextService = {
  async getContexts(): Promise<ApiResponse<CompanyContextType[]>> {
    return apiCall<CompanyContextType[]>('/context', {
      method: 'GET',
      headers: TokenManager.getAuthHeaders(),
    });
  },
  async createContext(context: Omit<CompanyContextType, 'id'>): Promise<ApiResponse<{ context_id: number }>> {
    // Adapter les champs pour le backend
    return apiCall<{ context_id: number }>('/context', {
      method: 'POST',
      body: JSON.stringify({
        nom_entreprise: context.nom_entreprise,
        domaine: context.domaine,
        valeurs: context.values, // le backend accepte un tableau ou string JSON
        description_culture: context.culture,
      }),
      headers: TokenManager.getAuthHeaders(),
    });
  },
  async deleteContext(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiCall<{ message: string }>(`/context/${id}`, {
      method: 'DELETE',
      headers: TokenManager.getAuthHeaders(),
    });
  },
};

export { TokenManager };