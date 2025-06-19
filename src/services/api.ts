
// Configuration et services API pour TheRecruit
const API_BASE_URL = 'https://tecnnovabackend-dev.onrender.com/api';

// Types d'API basés sur votre backend
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface JobBrief {
  id: number;
  title: string;
  skills: string[];
  experience: string;
  description: string;
  full_data?: any;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface CVAnalysis {
  competences: string[];
  experience: string[];
  education: string[];
  score: number;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  purpose: string;
}

export interface PredictiveAnalysis {
  predictive_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface Candidate {
  id: number;
  name: string;
  cv_analysis: CVAnalysis;
  predictive_score: number;
  status: string;
  appreciations: Array<{
    question: string;
    category: string;
    appreciation: string;
    score: number;
  }>;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  status?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Gestion du token JWT
class TokenManager {
  private static TOKEN_KEY = 'therecruit_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  static getAuthHeadersMultipart(): HeadersInit {
    const token = this.getToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }
}

// Fonction utilitaire pour les appels API
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...TokenManager.getAuthHeaders(),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `Erreur HTTP ${response.status}` };
    }

    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    return { error: 'Erreur de connexion au serveur' };
  }
}

// Services d'authentification
export const authService = {
  async register(userData: { username: string; email: string; password: string }): Promise<ApiResponse<{ message: string; user: User }>> {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    const response = await apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.token) {
      TokenManager.setToken(response.data.token);
    }

    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } finally {
      TokenManager.removeToken();
    }
  },

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return apiCall('/auth/me');
  }
};

// Services pour les fiches de poste
export const jobService = {
  async createBrief(briefData: {
    title: string;
    skills: string[];
    experience: string;
    description: string;
  }): Promise<ApiResponse<JobBrief>> {
    return apiCall('/job-briefs', {
      method: 'POST',
      body: JSON.stringify(briefData)
    });
  },

  async getBriefs(): Promise<ApiResponse<JobBrief[]>> {
    const response = await apiCall<JobBrief[]>('/job-briefs');
    // Le backend retourne directement un array, pas un objet avec data
    if (Array.isArray(response)) {
      return { data: response as JobBrief[] };
    }
    return response as ApiResponse<JobBrief[]>;
  },

  async getBrief(id: number): Promise<ApiResponse<JobBrief>> {
    return apiCall(`/job-briefs/${id}`);
  }
};

// Services pour les CV
export const cvService = {
  async uploadCV(file: File): Promise<ApiResponse<{
    cv_analysis: CVAnalysis;
    score: any;
    report: string;
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/cv`, {
        method: 'POST',
        headers: TokenManager.getAuthHeadersMultipart(),
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || `Erreur HTTP ${response.status}` };
      }

      return { data };
    } catch (error) {
      console.error('Erreur upload CV:', error);
      return { error: 'Erreur lors du téléchargement du CV' };
    }
  },

  async getScores(): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/cv/scores`, {
        headers: TokenManager.getAuthHeadersMultipart()
      });

      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération scores:', error);
      return null;
    }
  }
};

// Services pour le contexte de l'entreprise
export const contextService = {
  async createContext(contextData: {
    values: string[];
    culture: string;
  }): Promise<ApiResponse<{
    message: string;
    questions: InterviewQuestion[];
  }>> {
    return apiCall('/context', {
      method: 'POST',
      body: JSON.stringify(contextData)
    });
  },

  async getQuestions(): Promise<ApiResponse<InterviewQuestion[]>> {
    const response = await apiCall<InterviewQuestion[]>('/context/questions');
    // Le backend retourne directement un array
    if (Array.isArray(response)) {
      return { data: response as InterviewQuestion[] };
    }
    return response as ApiResponse<InterviewQuestion[]>;
  }
};

// Services pour l'évaluation
export const evaluationService = {
  async submitEvaluation(
    candidateId: number,
    evaluationData: {
      appreciations: Array<{
        question: string;
        category: string;
        appreciation: string;
        score: number;
      }>;
    }
  ): Promise<ApiResponse<{
    message: string;
    analysis: PredictiveAnalysis;
  }>> {
    return apiCall(`/evaluation/${candidateId}`, {
      method: 'POST',
      body: JSON.stringify(evaluationData)
    });
  },

  async getRadar(): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/evaluation/radar`, {
        headers: TokenManager.getAuthHeadersMultipart()
      });

      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération radar:', error);
      return null;
    }
  }
};

// Services pour les candidats
export const candidateService = {
  async getCandidates(): Promise<ApiResponse<Candidate[]>> {
    const response = await apiCall<Candidate[]>('/candidates');
    // Le backend retourne directement un array
    if (Array.isArray(response)) {
      return { data: response as Candidate[] };
    }
    return response as ApiResponse<Candidate[]>;
  }
};

export { TokenManager };
