
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Brief from './pages/Brief';
import CV from './pages/CV';
import Context from './pages/Context';
import Evaluation from './pages/Evaluation';
import { authService, jobService, candidateService, User, JobBrief, Candidate } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeBrief, setActiveBrief] = useState<JobBrief | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [briefs, setBriefs] = useState<JobBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier la session au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.getMe();
        if (response.data?.user) {
          setUser(response.data.user);
          await loadAppData();
        }
      } catch (error) {
        console.log('Utilisateur non connecté');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadAppData = async () => {
    try {
      // Charger les briefs
      const briefsResponse = await jobService.getBriefs();
      if (briefsResponse.data) {
        setBriefs(briefsResponse.data);
        if (briefsResponse.data.length > 0) {
          setActiveBrief(briefsResponse.data[0]);
        }
      }

      // Charger les candidats
      const candidatesResponse = await candidateService.getCandidates();
      if (candidatesResponse.data) {
        setCandidates(candidatesResponse.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleLogin = async (userData: User) => {
    setUser(userData);
    await loadAppData();
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setActiveBrief(null);
    setCandidates([]);
    setBriefs([]);
  };

  const handleBriefChange = (brief: JobBrief | null) => {
    setActiveBrief(brief);
  };

  const shouldShowWelcome = () => {
    return user && briefs.length === 0;
  };

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

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (shouldShowWelcome()) {
    return <Welcome />;
  }

  return (
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
              />
            } 
          />
          <Route 
            path="/context" 
            element={
              <Context 
                activeBrief={activeBrief} 
                onBriefChange={handleBriefChange}
                briefs={briefs}
                setBriefs={setBriefs}
              />
            } 
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
  );
};

export default App;
