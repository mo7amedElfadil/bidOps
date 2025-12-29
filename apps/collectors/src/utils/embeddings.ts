const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'
const DEFAULT_EMBEDDING_DIM = 1536

export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || DEFAULT_EMBEDDING_DIM)

export function normalizeEmbeddingInput(parts: Array<string | null | undefined>) {
	return parts
		.map(value => (typeof value === 'string' ? value.trim() : ''))
		.filter(Boolean)
		.join('\n')
}

export function toVectorLiteral(values: number[]) {
	const clean = values.map(value => Number(value))
	if (!clean.length) return '[]'
	return `[${clean.join(',')}]`
}

export async function embedText(text: string): Promise<number[]> {
	const [embedding] = await embedTexts([text])
	return embedding
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
	const trimmed = texts.map(text => text.trim())
	if (!trimmed.length || trimmed.some(text => !text)) {
		throw new Error('Missing text for embedding')
	}
	const provider = (process.env.EMBEDDINGS_PROVIDER || process.env.AI_PROVIDER || 'openai').toLowerCase()
	const embeddings =
		provider === 'gemini' ? await embedBatchWithGemini(trimmed) : await embedBatchWithOpenAI(trimmed)
	if (!Array.isArray(embeddings) || !embeddings.length) {
		throw new Error('Embedding response missing vectors')
	}
	if (embeddings.length !== trimmed.length) {
		throw new Error(`Embedding response length mismatch: expected ${trimmed.length}, got ${embeddings.length}`)
	}
	for (const vector of embeddings) {
		if (!Array.isArray(vector) || !vector.length) {
			throw new Error('Embedding response missing vector')
		}
		if (EMBEDDING_DIM && vector.length !== EMBEDDING_DIM) {
			throw new Error(`Embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${vector.length}`)
		}
	}
	return embeddings.map(vector => vector.map(value => Number(value)))
}

async function embedWithOpenAI(text: string): Promise<number[]> {
	const [embedding] = await embedBatchWithOpenAI([text])
	return embedding
}

async function embedBatchWithOpenAI(texts: string[]): Promise<number[][]> {
	const key = process.env.OPENAI_API_KEY
	if (!key) {
		throw new Error('OPENAI_API_KEY missing')
	}
	const model = process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
	const res = await fetch('https://api.openai.com/v1/embeddings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			model,
			input: texts
		})
	})
	if (!res.ok) {
		const msg = await res.text()
		throw new Error(`OpenAI embedding error ${res.status}: ${msg}`)
	}
	const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> }
	if (!data?.data?.length) {
		throw new Error('OpenAI embedding response missing vectors')
	}
	return data.data.map(item => item.embedding ?? [])
}

async function embedWithGemini(text: string): Promise<number[]> {
	const [embedding] = await embedBatchWithGemini([text])
	return embedding
}

async function embedBatchWithGemini(texts: string[]): Promise<number[][]> {
	const key = process.env.GEMINI_API_KEY
	if (!key) {
		throw new Error('GEMINI_API_KEY missing')
	}
	const model = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${key}`
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			requests: texts.map(text => ({
				content: {
					parts: [{ text }]
				}
			}))
		})
	})
	if (!res.ok) {
		const msg = await res.text()
		throw new Error(`Gemini embedding error ${res.status}: ${msg}`)
	}
	const data = (await res.json()) as { embeddings?: Array<{ values?: number[] }> }
	if (!data?.embeddings?.length) {
		throw new Error('Gemini embedding response missing vectors')
	}
	return data.embeddings.map(item => item.values ?? [])
}
