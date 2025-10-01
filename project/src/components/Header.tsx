import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, ArrowLeft, PiggyBank } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, showBack = false, actions }) => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/link-bank':
        return 'Link Bank Account';
      case '/create-jar':
        return 'Create New Jar';
      case '/transactions':
        return 'Transaction History';
      case '/profile':
        return 'Profile';
      default:
        if (location.pathname.startsWith('/jar/')) {
          return 'Jar Details';
        }
        return 'Piggy Goals';
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            ) : (
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 hidden sm:block">
                  Piggy Goals
                </span>
              </Link>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {getTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {actions}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-medium">₹{state.user?.income?.toLocaleString() || 0}</span>
              <span className="text-gray-400">available</span>
            </div>

            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  {state.user?.profileImage ? (
                    <img
                      src={state.user.profileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {state.user?.name}
                </span>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;