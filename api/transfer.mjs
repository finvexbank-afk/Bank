import { handler } from '../netlify/functions/transfer.mjs';

// Vercel adapter for the existing transfer function. The function logic stays in
// netlify/functions/transfer.mjs so both hosts run exactly the same code.
export default async function transfer(req, res) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);

    const event = {
        httpMethod: req.method || 'POST',
        headers: req.headers || {},
        body: Buffer.concat(chunks).toString('utf8') || '{}'
    };

    const result = await handler(event);
    res.status(result.statusCode || 200);
    Object.entries(result.headers || {}).forEach(([key, value]) => res.setHeader(key, value));
    res.send(result.body);
}
