import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Brief from './pages/Brief';
import CV from './pages/CV';
import Context from './pages/Context';
import Evaluation from './pages/Evaluation';
import { briefsData, candidatesData } from './utils/mockData';

const App = () => {
  const [user, setUser] = useState(null);
  const [activeBrief, setActiveBrief] = useState(null);
  const [candidates, setCandidates] = useState(candidatesData);

  // Simuler la vérification de session au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('technova_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Sauvegarder l'utilisateur dans localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('technova_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('technova_user');
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveBrief(null);
    localStorage.removeItem('technova_user');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
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
                onBriefChange={setActiveBrief}
                candidates={candidates}
                setCandidates={setCandidates}
              />
            } 
          />
          <Route 
            path="/brief" 
            element={
              <Brief 
                activeBrief={activeBrief} 
                onBriefChange={setActiveBrief}
              />
            } 
          />
          <Route 
            path="/cv" 
            element={
              <CV 
                activeBrief={activeBrief} 
                onBriefChange={setActiveBrief}
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
                onBriefChange={setActiveBrief}
              />
            } 
          />
          <Route 
            path="/evaluation" 
            element={
              <Evaluation 
                activeBrief={activeBrief} 
                onBriefChange={setActiveBrief}
                candidates={candidates}
                setCandidates={setCandidates}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;