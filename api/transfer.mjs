import { handler } from '../netlify/functions/transfer.mjs';

// Vercel adapter for the existing transfer function. The business logic stays in
// netlify/functions/transfer.mjs so both hosts run exactly the same code.

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
