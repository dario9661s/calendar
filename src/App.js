// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CalendarPage from './pages/CalendarPage';
import AuthCallback from './components/AuthCallback';
import './App.css';
import ContactPage from './pages/ContactPage'; // was ContactsPage

function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      applyTelegramTheme(tg.themeParams);
    }
  }, []);

  const applyTelegramTheme = (themeParams) => {
    if (!themeParams) return;

    const root = document.documentElement;
    root.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
    root.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
    root.style.setProperty('--tg-button-color', themeParams.button_color || '#007AFF');
    root.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
    root.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color || '#f8f9fa');
    root.style.setProperty('--tg-hint-color', themeParams.hint_color || '#666666');
  };

  return (
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/:date" element={<CalendarPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/contact/:name" element={<ContactPage />} />

          </Routes>
        </div>
      </Router>
  );
}

export default App;