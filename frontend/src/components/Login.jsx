import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle Xero OAuth redirect with token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Accept both ?token=... and ?access_token=...
    const token = params.get('token') || params.get('access_token');

    console.log('Xero OAuth param:', params.toString());

    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
      navigate('/');
    }

  }, [navigate]);

  const XERO_CLIENT_ID = '7D0E365D876F432AB107DD9404E0ABB2';
  const XERO_CALLBACK_URL = 'http://localhost:5173/xero/callback'; // This should be a frontend route you handle
  const XERO_SCOPES = [
    'offline_access',
    'accounting.transactions',
    'openid',
    'profile',
    'email',
    'accounting.contacts',
    'accounting.settings'
  ].join(' ');
  const STATE = '1234';

  function handleXeroLogin() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: XERO_CLIENT_ID,
      redirect_uri: XERO_CALLBACK_URL,
      scope: XERO_SCOPES,
      state: STATE,
    });
    window.location.href = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI-Powered Invoice & Balance Sheet Manager
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Demo credentials are pre-filled for testing
          </div>
        </form>
        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={handleXeroLogin}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign in with Xero
          </button>
        </div>
      </div>
    </div>
  );
}
