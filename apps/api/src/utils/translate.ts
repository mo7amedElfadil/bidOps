const arabicRegex = /[\u0600-\u06FF]/

export type TranslationResult = {
	translated: string
	original?: string
}

export function containsArabic(text?: string | null) {
	if (!text) return false
	return arabicRegex.test(text)
}

export async function translateArabicStrict(text?: string | null): Promise<TranslationResult> {
	if (!text) {
		throw new Error('Missing text for translation')
	}
	const trimmed = text.trim()
	if (!trimmed) {
		throw new Error('Empty text for translation')
	}
	if (!containsArabic(trimmed)) {
		return { translated: trimmed }
	}

	const provider = (process.env.TRANSLATION_PROVIDER || process.env.AI_PROVIDER || 'openai').toLowerCase()
	const translated = provider === 'gemini' ? await translateWithGemini(trimmed) : await translateWithOpenAI(trimmed)
	if (!translated) {
		throw new Error('Arabic translation failed')
	}
	const cleaned = translated.replace(/^["'`]+|["'`]+$/g, '').trim()
	if (!cleaned) {
		throw new Error('Arabic translation returned empty text')
	}
	return { translated: cleaned, original: trimmed }
}

export async function translateArabicBatchStrict(texts: string[]): Promise<TranslationResult[]> {
	if (!texts.length) {
		throw new Error('Missing text for translation')
	}
	const trimmed = texts.map(text => (text || '').trim())
	if (trimmed.some(text => !text)) {
		throw new Error('Empty text for translation')
	}
	const provider = (process.env.TRANSLATION_PROVIDER || process.env.AI_PROVIDER || 'openai').toLowerCase()
	const translated = provider === 'gemini' ? await translateBatchWithGemini(trimmed) : await translateBatchWithOpenAI(trimmed)
	if (!translated?.length || translated.length !== trimmed.length) {
		throw new Error('Arabic batch translation failed')
	}
	const results = translated.map((text, index) => {
		const cleaned = text.replace(/^["'`]+|["'`]+$/g, '').trim()
		if (!cleaned) {
			throw new Error('Arabic translation returned empty text')
		}
		return { translated: cleaned, original: trimmed[index] }
	})
	return results
}

async function translateWithOpenAI(text: string): Promise<string | null> {
	const key = process.env.OPENAI_API_KEY
	if (!key) {
		throw new Error('OPENAI_API_KEY missing')
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
		throw new Error(`OpenAI error ${res.status}: ${msg}`)
	}
	const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
	const content = data?.choices?.[0]?.message?.content
	return typeof content === 'string' ? content.trim() : null
}

async function translateWithGemini(text: string): Promise<string | null> {
	const key = process.env.GEMINI_API_KEY
	if (!key) {
		throw new Error('GEMINI_API_KEY missing')
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
		throw new Error(`Gemini error ${res.status}: ${msg}`)
	}
	const data = (await res.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
	}
	const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
	return typeof content === 'string' ? content.trim() : null
}

function extractJsonArray(content?: string | null) {
	if (!content) return null
	const start = content.indexOf('[')
	const end = content.lastIndexOf(']')
	if (start === -1 || end === -1 || end <= start) return null
	const slice = content.slice(start, end + 1)
	try {
		const parsed = JSON.parse(slice)
		return Array.isArray(parsed) ? parsed : null
	} catch {
		return null
	}
}

async function translateBatchWithOpenAI(texts: string[]): Promise<string[] | null> {
	const key = process.env.OPENAI_API_KEY
	if (!key) {
		throw new Error('OPENAI_API_KEY missing')
	}
	const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
	const prompt = JSON.stringify(texts)
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
					content:
						'Translate each Arabic string in the JSON array to English. Return ONLY a JSON array of strings with the same order and length.'
				},
				{
					role: 'user',
					content: prompt
				}
			]
		})
	})
	if (!res.ok) {
		const msg = await res.text()
		throw new Error(`OpenAI error ${res.status}: ${msg}`)
	}
	const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
	const content = data?.choices?.[0]?.message?.content
	const parsed = extractJsonArray(content)
	return parsed ? parsed.map(item => String(item)) : null
}

async function translateBatchWithGemini(texts: string[]): Promise<string[] | null> {
	const key = process.env.GEMINI_API_KEY
	if (!key) {
		throw new Error('GEMINI_API_KEY missing')
	}
	const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
	const prompt = `Translate each Arabic string in the JSON array to English. Return ONLY a JSON array of strings with the same order and length.\n\n${JSON.stringify(texts)}`
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [
				{
					role: 'user',
					parts: [{ text: prompt }]
				}
			]
		})
	})
	if (!res.ok) {
		const msg = await res.text()
		throw new Error(`Gemini error ${res.status}: ${msg}`)
	}
	const data = (await res.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
	}
	const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
	const parsed = extractJsonArray(content)
	return parsed ? parsed.map(item => String(item)) : null
}
