import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('jalsuraksha_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('jalsuraksha_token', data.token);
      localStorage.setItem('jalsuraksha_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const quickDemoSwitch = async (role) => {
    const emailMap = {
      citizen: 'citizen@jalsuraksha.in',
      tester: 'tester@jalsuraksha.in',
      authority: 'authority@jalsuraksha.in',
      admin: 'admin@jalsuraksha.in',
    };
    if (!role || role === 'anonymous') {
      logout();
      return null;
    }
    return login(emailMap[role], 'password123');
  };

  const logout = () => {
    localStorage.removeItem('jalsuraksha_token');
    localStorage.removeItem('jalsuraksha_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, quickDemoSwitch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
