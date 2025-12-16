module.exports = {
	root: true,
	env: { es2022: true, node: true, browser: false },
	ignorePatterns: ['**/dist/**', '**/build/**', '**/.turbo/**'],
	parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
	extends: [],
	rules: {
		'no-console': 'off'
	}
}


