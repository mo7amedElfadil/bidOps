"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsArabic = containsArabic;
exports.translateArabicStrict = translateArabicStrict;
const arabicRegex = /[\u0600-\u06FF]/;
function containsArabic(text) {
    if (!text)
        return false;
    return arabicRegex.test(text);
}
async function translateArabicStrict(text) {
    if (!text) {
        throw new Error('Missing text for translation');
    }
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error('Empty text for translation');
    }
    if (!containsArabic(trimmed)) {
        return { translated: trimmed };
    }
    const provider = (process.env.TRANSLATION_PROVIDER || process.env.AI_PROVIDER || 'openai').toLowerCase();
    const translated = provider === 'gemini' ? await translateWithGemini(trimmed) : await translateWithOpenAI(trimmed);
    if (!translated) {
        throw new Error('Arabic translation failed');
    }
    const cleaned = translated.replace(/^["'`]+|["'`]+$/g, '').trim();
    if (!cleaned) {
        throw new Error('Arabic translation returned empty text');
    }
    return { translated: cleaned, original: trimmed };
}
async function translateWithOpenAI(text) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        throw new Error('OPENAI_API_KEY missing');
    }
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: 'Translate Arabic to English. Return only the translated text.'
                },
                {
                    role: 'user',
                    content: text
                }
            ]
        })
    });
    if (!res.ok) {
        const msg = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${msg}`);
    }
    const data = (await res.json());
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : null;
}
async function translateWithGemini(text) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error('GEMINI_API_KEY missing');
    }
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `Translate Arabic to English. Return only the translated text.\n\n${text}` }]
                }
            ]
        })
    });
    if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Gemini error ${res.status}: ${msg}`);
    }
    const data = (await res.json());
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof content === 'string' ? content.trim() : null;
}
//# sourceMappingURL=translate.js.map