function normalizeUrl(value) {
	if (!value) return ''
	return value.replace(/\/+$/, '')
}

const baseUrl =
	normalizeUrl(process.env.APP_BASE_URL || process.env.WEB_ORIGIN || 'http://localhost:8080') || 'http://localhost:8080'

function getAppBaseUrl() {
	return baseUrl
}

function getAppLogoUrl() {
	const override = process.env.APP_LOGO_URL && process.env.APP_LOGO_URL.trim()
	if (override) return override
	return `${baseUrl}/assets/logo.png`
}

function getSupportEmail() {
	return process.env.SUPPORT_EMAIL?.trim() || process.env.SMTP_FROM?.trim() || 'info@it-serve.qa'
}

module.exports = { getAppBaseUrl, getAppLogoUrl, getSupportEmail }
