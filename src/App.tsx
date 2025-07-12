import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Brief from './pages/Brief';
import CV from './pages/CV';
import Evaluation from './pages/Evaluation';
import Interview from './pages/Interview';
// Ensure each service is imported from its correct file if not default-exported from './services/api'
import { authService } from './services/api';
import { jobService } from './services/api';
import { candidateService } from './services/api'; // Make sure candidateService is exported and has getCandidates
import { User, JobBrief, Candidate, TokenManager } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeBrief, setActiveBrief] = useState<JobBrief | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [briefs, setBriefs] = useState<JobBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier la session au démarrage
  useEffect(() => {
    const initializeApp = async () => {
      // En mode dev, supprimer le token et réinitialiser les états
      if (import.meta.env.DEV) {
        TokenManager.removeToken();
        setUser(null);
        setActiveBrief(null);
        setCandidates([]);
        setBriefs([]);
      } else {
        // En mode production, vérifier si un token existe et est valide
        const token = TokenManager.getToken();
        if (token) {
          try {
            const response = await authService.getMe();
            if (response.data?.user) {
              setUser(response.data.user);
              await loadAppData();
            } else {
              TokenManager.removeToken();
              setUser(null);
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
            TokenManager.removeToken();
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Charger les données après connexion ou changement d'état
  const loadAppData = async () => {
    try {
      const briefsResponse = await jobService.getBriefs();
      console.log('Réponse de getBriefs:', briefsResponse);
      if (briefsResponse.data) {
        setBriefs(briefsResponse.data);
        if (briefsResponse.data.length > 0 && !activeBrief) {
          setActiveBrief(briefsResponse.data[0]);
        }
      }

      const candidatesResponse = await candidateService.getCandidates();
      console.log('Réponse de getCandidates:', candidatesResponse);
      if (candidatesResponse.data) {
        // Parser les données JSON stockées en tant que strings
        const parsedCandidates = candidatesResponse.data.map((candidate: any) => {
          try {
            return {
              ...candidate,
              radar_data: typeof candidate.radar_data === 'string' 
                ? JSON.parse(candidate.radar_data) 
                : candidate.radar_data,
              risks: typeof candidate.risks === 'string' 
                ? JSON.parse(candidate.risks) 
                : candidate.risks,
              recommendations: typeof candidate.recommendations === 'string' 
                ? JSON.parse(candidate.recommendations) 
                : candidate.recommendations,
              appreciations: typeof candidate.appreciations === 'string' 
                ? JSON.parse(candidate.appreciations) 
                : candidate.appreciations,
              interview_questions: typeof candidate.interview_questions === 'string' 
                ? JSON.parse(candidate.interview_questions) 
                : candidate.interview_questions,
              score_details: typeof candidate.score_details === 'string' 
                ? JSON.parse(candidate.score_details) 
                : candidate.score_details
            };
          } catch (e) {
            console.warn('Erreur de parsing pour le candidat:', candidate.id, e);
            return candidate;
          }
        });
        setCandidates(parsedCandidates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  // Mettre à jour les données après connexion
  const handleLogin = async (userData: User) => {
    console.log('handleLogin called with:', userData);
    setUser(userData);
    await loadAppData(); // Charger les données après login
    console.log('User logged in successfully:', userData);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      TokenManager.removeToken();
      setUser(null);
      setActiveBrief(null);
      setCandidates([]);
      setBriefs([]);
    }
  };

  const handleBriefChange = (brief: JobBrief | null) => {
    setActiveBrief(brief);
  };

  // Afficher le loader pendant l'initialisation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté, afficher la page d'authentification
  if (!user) {
    console.log('No user found, showing Auth page');
    return <Auth onLogin={handleLogin} />;
  }

  // Si utilisateur connecté, afficher l'application
  console.log('User found, showing Dashboard:', user);

  // Log pour diagnostiquer le state briefs à chaque render
  console.log('DEBUG RENDER App.tsx - briefs:', briefs);

  return (
    <>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  activeBrief={activeBrief} 
                  onBriefChange={handleBriefChange}
                  candidates={candidates}
                  setCandidates={setCandidates}
                  briefs={briefs}
                  setBriefs={setBriefs}
                />
              } 
            />
            <Route 
              path="/brief" 
              element={
                <Brief 
                  activeBrief={activeBrief} 
                  onBriefChange={handleBriefChange}
                  briefs={briefs}
                  setBriefs={setBriefs}
                />
              } 
            />
            <Route 
              path="/cv" 
              element={
                <CV 
                  activeBrief={activeBrief} 
                  onBriefChange={handleBriefChange}
                  candidates={candidates}
                  setCandidates={setCandidates}
                  briefs={briefs}
                  setBriefs={setBriefs}
                />
              } 
            />
            <Route 
              path="/interview" 
              element={<Interview />} 
            />
            <Route 
              path="/evaluation" 
              element={
                <Evaluation 
                  activeBrief={activeBrief} 
                  onBriefChange={handleBriefChange}
                  candidates={candidates}
                  setCandidates={setCandidates}
                  briefs={briefs}
                  setBriefs={setBriefs}
                />
              } 
            />
          </Routes>
        </div>
      </Router>
    </>
  );
};

export default App;