import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">AI Invoice Manager</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>

        <nav className="mt-6">
          <div className="px-6 space-y-2">
            <Link
              to="/"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${location.pathname === '/'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat Assistant</span>
            </Link>

            <Link
              to="/dashboard"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${location.pathname === '/dashboard'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired
};
