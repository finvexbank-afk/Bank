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
    fr: 'Saisissez le code de confirmation Finvex qui vous a été communiqué par la banque pour continuer votre virement.',
    en: 'Enter the Finvex confirmation code provided to you by the bank to continue your transfer.',
    es: 'Introduzca el código de confirmación Finvex que le comunicó el banco para continuar su transferencia.',
    de: 'Geben Sie den von der Bank mitgeteilten Finvex-Bestätigungscode ein, um die Überweisung fortzusetzen.'
};

export const generateTransferCode = (label = 'FINVEX-1', language = 'fr', order = 0) => ({
    id: `code_${Date.now()}_${randomPart(6)}`,
    label,
    value: `${randomPart(4)}-${randomPart(4)}`,
    message: DEFAULT_TRANSFER_CODE_MESSAGES[language] || DEFAULT_TRANSFER_CODE_MESSAGES.fr,
    requiresOtp: false,
    enabled: true,
    scope: 'client',
    order,
    createdAt: new Date().toISOString()
});

export const createDefaultClientCodes = (language = 'fr') =>
    DEFAULT_TRANSFER_CODE_LABELS.map((label, index) => generateTransferCode(label, language, index));

export const findMatchingClientCode = (codes, value) => {
    const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '');
    return (codes || []).find((code) =>
        code.enabled !== false &&
        String(code.value || '').trim().toUpperCase().replace(/[\s-]+/g, '') === normalized
    );
};
