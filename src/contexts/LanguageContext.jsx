import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    const languages = {
        en: {
            code: 'en',
            name: 'English',
            flag: 'https://flagcdn.com/w20/gb.png'
        },
        fr: {
            code: 'fr',
            name: 'Français',
            flag: 'https://flagcdn.com/w20/fr.png'
        },
        de: {
            code: 'de',
            name: 'Deutsch',
            flag: 'https://flagcdn.com/w20/de.png'
        },
        es: {
            code: 'es',
            name: 'Español',
            flag: 'https://flagcdn.com/w20/es.png'
        }
    };

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const changeLanguage = (langCode) => {
        if (languages[langCode]) {
            setLanguage(langCode);
        }
    };

    const currentLanguage = languages[language];

    return (
        <LanguageContext.Provider value={{
            language,
            languages,
            currentLanguage,
            changeLanguage,
            isRTL: ['ar', 'he'].includes(language)
        }}>
            {children}
        </LanguageContext.Provider>
    );
};
