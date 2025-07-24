// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext(null);

// Create a custom hook for easy access to the context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null); // Will store { id: 'userId' } from decoded token
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // To manage initial loading state

  // Function to decode JWT (simple client-side decode)
  const decodeToken = (jwtToken) => {
    try {
      if (!jwtToken) return null;
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  };

  // Effect to run once on component mount to check for existing token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) { // Check if token is not expired
        setToken(storedToken);
        setUser(decoded.user); // Assuming user info is in 'user' field
        setIsAuthenticated(true);
      } else {
        // Token expired or invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false); // Finished initial loading check
  }, []);

  // Function to handle login
  const login = async (email, password) => {
    try {
      const res = await axios.post(import.meta.env.VITE_API_BASE_URL + '/auth/login', { email, password });
      const { token: newToken, msg } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      const decoded = decodeToken(newToken);
      setUser(decoded.user);
      setIsAuthenticated(true);
      return { success: true, msg };
    } catch (err) {
      console.error('Login error:', err.response?.data?.msg || err.message);
      return { success: false, msg: err.response?.data?.msg || 'Login failed' };
    }
  };

  // Function to handle registration
  const register = async (email, password) => {
    try {
      const res = await axios.post(import.meta.env.VITE_API_BASE_URL + '/auth/register', { email, password });
      const { token: newToken, msg } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      const decoded = decodeToken(newToken);
      setUser(decoded.user);
      setIsAuthenticated(true);
      return { success: true, msg };
    } catch (err) {
      console.error('Registration error:', err.response?.data?.msg || err.message);
      return { success: false, msg: err.response?.data?.msg || 'Registration failed' };
    }
  };

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    token,
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Only render children after initial token check */}
    </AuthContext.Provider>
  );
};