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

