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

