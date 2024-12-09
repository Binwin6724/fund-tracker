import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => {
  return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.settings?.language) {
      i18n.changeLanguage(user.settings.language);
    }
  }, [user, i18n]);

  const value = {
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
