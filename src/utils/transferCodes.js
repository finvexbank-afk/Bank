// Codes de confirmation de virement générés pour chaque client.
// Ces codes sont des références internes Finvex : ils ne représentent aucune
// autorité externe et ne doivent jamais être présentés comme tels.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomPart = (length) => {
    let out = '';
    const bytes = new Uint32Array(length);
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(bytes);
        for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
    } else {
        for (let i = 0; i < length; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    return out;
};

export const DEFAULT_TRANSFER_CODE_LABELS = [
    'FINVEX-1',
    'FINVEX-2',
    'FINVEX-3'
];

export const DEFAULT_TRANSFER_CODE_MESSAGES = {
    fr: 'Saisissez le code de confirmation Finvex affiché dans votre espace client pour continuer votre virement.',
    en: 'Enter the Finvex confirmation code shown in your account to continue your transfer.',
    es: 'Introduzca el código de confirmación Finvex mostrado en su cuenta para continuar la transferencia.',
    de: 'Geben Sie den in Ihrem Konto angezeigten Finvex-Bestätigungscode ein, um die Überweisung fortzusetzen.'
};

export const generateTransferCode = (label = 'FINVEX-1', language = 'fr') => ({
    id: `code_${Date.now()}_${randomPart(6)}`,
    label,
    value: `${randomPart(4)}-${randomPart(4)}`,
    message: DEFAULT_TRANSFER_CODE_MESSAGES[language] || DEFAULT_TRANSFER_CODE_MESSAGES.fr,
    enabled: true,
    scope: 'client',
    createdAt: new Date().toISOString()
});

export const createDefaultClientCodes = (language = 'fr') =>
    DEFAULT_TRANSFER_CODE_LABELS.map((label) => generateTransferCode(label, language));

export const findMatchingClientCode = (codes, value) => {
    const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '');
    return (codes || []).find((code) =>
        code.enabled !== false &&
        String(code.value || '').trim().toUpperCase().replace(/[\s-]+/g, '') === normalized
    );
};
