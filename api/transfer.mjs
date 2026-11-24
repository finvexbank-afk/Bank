// Vercel adapter for the shared transfer function.
// The business logic lives in netlify/functions/transfer.mjs so both hosts run
// exactly the same code. The module is imported lazily so a bundling problem
// surfaces as an explicit JSON error instead of an opaque
// FUNCTION_INVOCATION_FAILED.

const readBody = async (req) => {
    // Vercel pre-parses JSON bodies for Node functions, so req.body can already
    // be an object. Reading the stream in that case yields nothing.
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'string') return req.body || '{}';
        if (Buffer.isBuffer(req.body)) return req.body.toString('utf8') || '{}';
        try {
            return JSON.stringify(req.body);
        } catch {
            return '{}';
        }
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8') || '{}';
};

export default async function transfer(req, res) {
    let handler;

    try {
        ({ handler } = await import('../netlify/functions/transfer.mjs'));
    } catch (error) {
        console.error('[api/transfer] cannot load shared handler:', error);
        return res.status(500).json({
            error: `Impossible de charger le module partagé: ${error?.message || 'unknown'}`,
            code: error?.code || null
        });
    }

    try {
        const event = {
            httpMethod: req.method || 'POST',
            headers: req.headers || {},
            body: await readBody(req)
        };

        const result = await handler(event);

        res.status(result.statusCode || 200);
        Object.entries(result.headers || {}).forEach(([key, value]) => res.setHeader(key, value));
        res.send(result.body);
    } catch (error) {
        console.error('[api/transfer] adapter failure:', error);
        res.status(500).json({ error: `Adapter failure: ${error?.message || 'unknown error'}` });
    }
}
