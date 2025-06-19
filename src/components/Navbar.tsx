
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../services/api';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { path: '/brief', label: 'Brief', icon: 'fas fa-file-text' },
    { path: '/cv', label: 'CV', icon: 'fas fa-file-upload' },
    { path: '/context', label: 'Contexte', icon: 'fas fa-building' },
    { path: '/evaluation', label: 'Évaluation', icon: 'fas fa-chart-pie' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-tie text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold text-gray-900">TheRecruit</span>
            <span className="hidden sm:inline text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">RH</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="fas fa-user text-gray-400"></i>
              <span>{user?.username || 'Utilisateur'}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Déconnexion"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-600">
                  <i className="fas fa-user"></i>
                  <span>{user?.username || 'Utilisateur'}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 w-full text-left"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
