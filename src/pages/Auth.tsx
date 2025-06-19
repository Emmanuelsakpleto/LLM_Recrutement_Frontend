
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { authService, User } from '../services/api';

interface AuthProps {
  onLogin: (user: User) => void;
}

interface FormData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('Soumission', { isLogin, formData });

  if (!formData.email || !formData.password) {
    setToast({ message: 'Tous les champs sont requis', type: 'error' });
    return;
  }

  if (!isLogin) {
    if (!formData.name) {
      setToast({ message: 'Le nom est requis pour l\'inscription', type: 'error' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }
  }

  setIsLoading(true);
  try {
    let response;
    if (isLogin) {
      response = await authService.login({
        email: formData.email,
        password: formData.password,
      });
    } else {
      response = await authService.register({
        username: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }

    console.log('Réponse API:', response);
    if (response.error) {
      setToast({ message: response.error, type: 'error' });
    } else if (response.message) {
      setToast({ message: response.message, type: 'success' });
      if (isLogin) {
        onLogin(response.user || { id: 1, email: formData.email, username: formData.name || '' }); // Ajuste selon la réponse
      } else {
        setTimeout(() => {
          setIsLogin(true);
          setFormData(prev => ({ ...prev, name: '', confirmPassword: '' }));
        }, 1500);
      }
    }
  } catch (error) {
    console.error('Erreur détaillée:', error);
    setToast({ message: 'Erreur serveur ou réseau : ' + (error.message || 'Inconnu'), type: 'error' });
  } finally {
    setIsLoading(false);
  }
};

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
    setToast(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mb-4">
            <i className="fas fa-user-tie text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TheRecruit</h1>
          <p className="text-gray-600">
            {isLogin ? 'Connectez-vous à votre tableau de bord' : 'Créez votre compte'}
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Votre nom complet"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="votre.email@entreprise.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              loading={isLoading}
              className="w-full"
            >
              {isLoading 
                ? (isLogin ? 'Connexion en cours...' : 'Inscription en cours...') 
                : (isLogin ? 'Se connecter' : 'S\'inscrire')
              }
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLogin 
                ? 'Pas encore de compte ? S\'inscrire' 
                : 'Déjà un compte ? Se connecter'
              }
            </button>
          </div>
        </Card>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
