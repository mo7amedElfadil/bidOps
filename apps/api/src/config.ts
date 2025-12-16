export function getConfig() {
	return {
		port: Number(process.env.PORT || 3000),
		databaseUrl:
			process.env.DATABASE_URL ||
			'postgresql://bidops:bidops@localhost:5432/bidops?schema=public',
		openSearchHost: process.env.OPENSEARCH_HOST || 'http://localhost:9200'
	}
}


