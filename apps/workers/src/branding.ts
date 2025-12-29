function normalizeUrl(value?: string) {
	if (!value) return ''
	return value.replace(/\/+$/, '')
}

const baseUrl =
	normalizeUrl(process.env.APP_BASE_URL || process.env.WEB_ORIGIN || 'http://localhost:8080') ||
	'http://localhost:8080'

export function getAppBaseUrl() {
	return baseUrl
}

export function getAppLogoUrl() {
	const override = process.env.APP_LOGO_URL?.trim()
	if (override) return override
	return `${baseUrl}/assets/logo.png`
}

export function getSupportEmail() {
	return (
		process.env.SUPPORT_EMAIL?.trim() ||
		process.env.SMTP_FROM?.trim() ||
		'info@it-serve.qa'
	)
}
