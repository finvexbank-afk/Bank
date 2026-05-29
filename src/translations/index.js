import en from './en.json';
import fr from './fr.json';
import de from './de.json';
import es from './es.json';

const translations = {
    en,
    fr,
    de,
    es
};

export const t = (key, language = 'en') => {
    const keys = key.split('.');
    let translation = translations[language];
    
    for (const k of keys) {
        if (translation && translation[k]) {
            translation = translation[k];
        } else {
            // Fallback to English if key not found
            translation = translations.en;
            for (const fallbackKey of keys) {
                if (translation && translation[fallbackKey]) {
                    translation = translation[fallbackKey];
                } else {
                    return key; // Return key if not found anywhere
                }
            }
            break;
        }
    }
    
    return translation || key;
};

export default translations;
