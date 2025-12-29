export function buildFrontendUrl(path: string) {
	const origin = process.env.WEB_ORIGIN || 'http://localhost:8080'
	const normalized = path.startsWith('/') ? path : `/${path}`
	return `${origin}${normalized}`
}
