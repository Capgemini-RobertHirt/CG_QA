<<<<<<< HEAD
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(t('auth.invalidCredentials'));
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      await login('admin', 'admin123');
      navigate('/');
    } catch (err) {
      setError(t('auth.loginFailed'));
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="login-container">
      <div className="language-selector">
        <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
        <button onClick={() => changeLanguage('fr')} className={i18n.language === 'fr' ? 'active' : ''}>FR</button>
        <button onClick={() => changeLanguage('de')} className={i18n.language === 'de' ? 'active' : ''}>DE</button>
      </div>
      
      <div className="login-card">
        <h1>{t('common.appName')}</h1>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder={t('auth.username')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder={t('auth.password')}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <button className="demo-button" onClick={handleDemoLogin} disabled={loading}>
          {t('auth.demo')} ({t('auth.username')}: admin, {t('auth.password')}: admin123)
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
=======
import React, { useState, FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, error: authError, loading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError(t('auth.usernameRequired') || 'Username is required');
      return;
    }
    if (!password.trim()) {
      setError(t('auth.passwordRequired') || 'Password is required');
      return;
    }

    try {
      await login(username, password);
    } catch (err) {
      setError(authError || t('auth.loginFailed') || 'Login failed. Please try again.');
    }
  };

  const handleDemoLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login('admin', 'admin123');
    } catch (err) {
      setError('Demo login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{t('auth.loginTitle') || 'Login'}</h1>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="language-selector"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              {t('auth.username') || 'Username'}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.enterUsername') || 'Enter your username'}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {t('auth.password') || 'Password'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.enterPassword') || 'Enter your password'}
              disabled={loading}
              required
            />
          </div>

          {(error || authError) && (
            <div className="error-message">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (t('auth.loggingIn') || 'Logging in...') : (t('auth.login') || 'Login')}
          </button>
        </form>

        <div className="demo-section">
          <p>{t('auth.demoNotice') || 'Demo credentials available'}</p>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="demo-button"
          >
            Try Demo (admin/admin123)
          </button>
        </div>
      </div>
    </div>
  );
}
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
