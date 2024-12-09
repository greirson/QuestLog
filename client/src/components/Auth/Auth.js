import React, { useEffect, useState } from 'react';
import { debounce } from 'lodash';
const API_BASE_URL = process.env.REACT_APP_PROD || 'http://localhost:3001/api';

const Auth = ({ isAuthenticated, onAuthChange, onLogout, handleUserDataLoad}) => {
  const [user, setUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showLegacyWarning, setShowLegacyWarning] = useState(false);
  const [showCookieWarning, setShowCookieWarning] = useState(false);

  useEffect(() => {
    const checkCookies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/current_user`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // If response is null (401), cookies might be blocked
        const data = await response.json();
        if (data === null) {
          setShowCookieWarning(true);
        }
      } catch (error) {
        console.error('Cookie check failed:', error);
      }
    };

    checkCookies();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('oauth')) {
      setSessionChecked(false); // Force session check after OAuth
    }
  }, []);

  useEffect(() => {
    if (isLoggingOut) {
      setUser(null);
      setSessionChecked(true);
      setIsLoggingOut(false); // Reset logout state
      return;
    }

    const abortController = new AbortController();
    let mounted = true;

    const checkSession = debounce(async () => {
      // Don't check if session is already checked or we just logged out
      if (sessionChecked || isLoggingOut) return;  

      const hasLegacyAuth = localStorage.getItem('authToken') || 
                         localStorage.getItem('userId');
      
      if (hasLegacyAuth) {
        setShowLegacyWarning(true);
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/current_user`, {
          credentials: 'include',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
    
        if (!response.ok) {
          if (response.status === 401 && mounted) {
            setUser(null);
            onAuthChange(null);
            setSessionChecked(true);
            return;
          }
          throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
        if (mounted) {
          setUser(data);
          onAuthChange(data.userId);
          setSessionChecked(true);
          handleUserDataLoad(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && mounted) {
          setUser(null);
          onAuthChange(null);
          setSessionChecked(true);
        }
      }
    }, 100);

    checkSession();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [isLoggingOut, sessionChecked, onAuthChange, handleUserDataLoad, isAuthenticated]);

  const login = () => {
    window.location.href = `${API_BASE_URL}/auth/oidc`;
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        credentials: 'include'
      });
      localStorage.clear();
      setUser(null);
      setSessionChecked(true); // Set session as checked
      onAuthChange(null, true);  // Pass true to indicate active logout
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <>
      {showCookieWarning && (
        <div className="fixed top-0 left-0 right-0 bg-red-100 dark:bg-red-900 p-4 text-center z-50 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-red-800 dark:text-red-200">
              ⚠️ Please enable third-party cookies in your browser settings to use all features. The app requires cookies for authentication.
            </p>
            <button 
              onClick={() => setShowCookieWarning(false)}
              className="ml-4 text-red-900 dark:text-red-100 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {showLegacyWarning && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900 p-4 text-center z-50 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Please clear your browser data and sign in again to ensure the best experience. Your tasks and progress will not be affected.
            </p>
            <button 
              onClick={() => setShowLegacyWarning(false)}
              className="ml-4 text-yellow-900 dark:text-yellow-100 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center">
        {user ? (
          <div className="flex items-center">
            <img 
              src={user.picture} 
              alt="Profile" 
              className="w-8 h-8 rounded-full mr-2"
            />
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-800 
                       shadow-[2px_2px_#77dd77] hover:shadow-none hover:translate-x-0.5 
                       hover:translate-y-0.5 transition-all duration-200 text-gray-800 dark:text-white"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-800 
                     shadow-[2px_2px_#77dd77] hover:shadow-none hover:translate-x-0.5 
                     hover:translate-y-0.5 transition-all duration-200 flex items-center gap-2 
                     text-gray-800 dark:text-white"
          >
            <span>Sign in</span>
          </button>
        )}
      </div>
    </>
  );
};

export default Auth;