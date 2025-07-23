import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage on mount
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token }); // You can expand this with more user info if needed
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Optionally, listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem('token');
      setUser(token ? { token } : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (email, password) => {
    // Your login logic here
    // On success: setUser({ ...userData });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useAuth() {
  return useContext(AuthContext);
}
