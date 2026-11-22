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

const interpolate = (value, vars) => {
    if (!vars || typeof value !== 'string') return value;
    return value.replace(/\{\{(\w+)\}\}/g, (match, name) => (
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
    ));
};

export const t = (key, language = 'en', vars) => {
    const resolve = (locale) => {
        const catalog = translations[locale] || {};
        // Flat dotted keys are stored verbatim; nested keys remain supported.
        if (typeof catalog[key] === 'string') return catalog[key];
        let value = catalog;
        for (const part of key.split('.')) {
            if (value && typeof value === 'object' && typeof value[part] !== 'undefined') {
                value = value[part];
            } else {
                return undefined;
            }
        }
        return typeof value === 'string' ? value : undefined;
    };

    const translated = resolve(language) ?? resolve('en');
    return interpolate(translated ?? key, vars);
};

export default translations;
