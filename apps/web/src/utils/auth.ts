export const TOKEN_KEY = 'token'

export function getToken() {
	if (typeof window === 'undefined') return null
	return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
	if (typeof window === 'undefined') return
	localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
	if (typeof window === 'undefined') return
	localStorage.removeItem(TOKEN_KEY)
}

export function redirectToLogin() {
	if (typeof window === 'undefined') return
	window.location.replace('/auth/dev')
}

export function parseJwt(token: string): Record<string, any> | null {
	try {
		const parts = token.split('.')
		if (parts.length < 2) return null
		const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
		return JSON.parse(decoded)
	} catch {
		return null
	}
}

export function getUserRole(): string | null {
	const token = getToken()
	if (!token) return null
	const payload = parseJwt(token)
	return payload?.role || null
}
