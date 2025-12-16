export interface Clause {
	number?: string
	text: string
}

export function splitIntoClauses(input: string): string[] {
	// 1. First cleanup
	const clean = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

	// 2. Naive split by double newline first to get chunks
	const chunks = clean.split(/\n{2,}/)

	// 3. Process chunks to see if we can find numbered lists
	const results: string[] = []
	
	for (const chunk of chunks) {
		const lines = chunk.split('\n')
		let currentClause = ''

		for (const line of lines) {
			const trimmed = line.trim()
			if (!trimmed) continue

			// Check for start pattern like "1.", "1.1.", "(a)", etc.
			const isStart = /^(?:\d+\.)+|^\([a-z0-9]+\)|^[a-z]\)/i.test(trimmed)

			if (isStart) {
				if (currentClause) {
					results.push(currentClause.trim())
				}
				currentClause = trimmed
			} else {
				// Continuation
				if (currentClause) {
					currentClause += ' ' + trimmed
				} else {
					currentClause = trimmed
				}
			}
		}
		if (currentClause) results.push(currentClause.trim())
	}

	// Fallback if heuristics fail significantly, return chunks
	if (results.length === 0 && chunks.length > 0) {
		return chunks.map(c => c.trim()).filter(Boolean)
	}

	return results.length > 0 ? results : chunks.map(c => c.trim()).filter(Boolean)
}
