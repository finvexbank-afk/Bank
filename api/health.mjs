// Lightweight diagnostic endpoint. Never exposes secret values, only their presence.
export default function health(req, res) {
    res.status(200).json({
        ok: true,
        runtime: 'node',
        hasServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
        hasResendKey: Boolean(process.env.RESEND_API_KEY),
        resendFrom: process.env.RESEND_FROM || null,
        adminEmail: process.env.ADMIN_EMAIL || null
    });
}
