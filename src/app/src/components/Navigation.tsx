import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navigation.css';

function Navigation() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <nav className="navigation">
      <div className="nav-left">
        <h2 onClick={() => navigate('/')} className="logo">
          {t('common.appName')}
        </h2>
      </div>

      <div className={`nav-center ${mobileMenuOpen ? 'open' : ''}`}>
        <button onClick={() => navigate('/')}>{t('pages.home')}</button>
        {user?.isAdmin && <button onClick={() => navigate('/admin')}>{t('pages.admin')}</button>}
        <button onClick={() => navigate('/history')}>{t('pages.history')}</button>
      </div>

      <div className="nav-right">
        <div className="language-buttons">
          <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
          <button onClick={() => changeLanguage('fr')} className={i18n.language === 'fr' ? 'active' : ''}>FR</button>
          <button onClick={() => changeLanguage('de')} className={i18n.language === 'de' ? 'active' : ''}>DE</button>
        </div>
        <span className="user-info">{user?.username}</span>
        <button onClick={handleLogout} className="logout-button">{t('common.logout')}</button>
      </div>

      <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        ☰
      </button>
    </nav>
  );
}

export default Navigation;
=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

export default function Navigation() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="brand-icon">🎯</span>
          <span className="brand-name">CG QA</span>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>

        <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="nav-links">
            <button
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
              className="nav-link"
            >
              {t('nav.home') || 'Home'}
            </button>

            {user?.isAdmin && (
              <button
                onClick={() => {
                  navigate('/admin');
                  setMobileMenuOpen(false);
                }}
                className="nav-link"
              >
                {t('nav.admin') || 'Admin'}
              </button>
            )}

            <button
              onClick={() => {
                navigate('/history');
                setMobileMenuOpen(false);
              }}
              className="nav-link"
            >
              {t('nav.history') || 'History'}
            </button>
          </div>

          <div className="nav-user">
            <div className="language-selector">
              <button
                onClick={() => changeLanguage('en')}
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('fr')}
                className={`lang-btn ${i18n.language === 'fr' ? 'active' : ''}`}
              >
                FR
              </button>
              <button
                onClick={() => changeLanguage('de')}
                className={`lang-btn ${i18n.language === 'de' ? 'active' : ''}`}
              >
                DE
              </button>
            </div>

            <div className="user-info">
              <span className="user-name">{user?.username || 'User'}</span>
              <button onClick={handleLogout} className="logout-btn">
                {t('common.logout') || 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
