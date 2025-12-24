const arabicRegex = /[\u0600-\u06FF]/
const cache = new Map<string, string>()

type TranslateResult = { translated: string; original?: string }

export async function translateIfArabic(text?: string): Promise<TranslateResult> {
	if (!text) return { translated: '' }
	if (!arabicRegex.test(text)) return { translated: text }
	const trimmed = text.trim()
	if (!trimmed) return { translated: text }
	const cached = cache.get(trimmed)
	if (cached) return { translated: cached, original: trimmed }
	if (process.env.COLLECTOR_TRANSLATE_TITLES === 'false') {
		return { translated: trimmed, original: trimmed }
	}
	const provider = (process.env.COLLECTOR_TRANSLATION_PROVIDER || process.env.AI_PROVIDER || 'openai').toLowerCase()
	let translated: string | null = null
	try {
		if (provider === 'gemini') {
			translated = await translateWithGemini(trimmed)
		} else {
			translated = await translateWithOpenAI(trimmed)
		}
	} catch (err: any) {
		console.warn(`[translator] Failed to translate title: ${err?.message || err}`)
	}
	if (!translated) {
		return { translated: trimmed, original: trimmed }
	}
	const cleaned = translated.replace(/^["'`]+|["'`]+$/g, '').trim()
	cache.set(trimmed, cleaned)
	return { translated: cleaned, original: trimmed }
}

async function translateWithOpenAI(text: string): Promise<string | null> {
	const key = process.env.OPENAI_API_KEY
	if (!key) {
		console.warn('[translator] OPENAI_API_KEY missing; skipping translation')
		return null
	}
	const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
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
	})
	if (!res.ok) {
		const msg = await res.text()
		console.warn(`[translator] OpenAI error ${res.status}: ${msg}`)
		return null
	}
	const data = await res.json()
	const content = data?.choices?.[0]?.message?.content
	return typeof content === 'string' ? content.trim() : null
}

async function translateWithGemini(text: string): Promise<string | null> {
	const key = process.env.GEMINI_API_KEY
	if (!key) {
		console.warn('[translator] GEMINI_API_KEY missing; skipping translation')
		return null
	}
	const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
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
	})
	if (!res.ok) {
		const msg = await res.text()
		console.warn(`[translator] Gemini error ${res.status}: ${msg}`)
		return null
	}
	const data = await res.json()
	const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
	return typeof content === 'string' ? content.trim() : null
}
