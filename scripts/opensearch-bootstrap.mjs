const host = process.env.OPENSEARCH_HOST || 'http://localhost:9200'

async function createIndex(name, body = {}) {
	const res = await fetch(`${host}/${name}`, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	})
	if (!res.ok && res.status !== 400) {
		const text = await res.text()
		throw new Error(`Failed to create index ${name}: ${res.status} ${text}`)
	}
}

async function main() {
	await createIndex('documents', {
		settings: { number_of_shards: 1, number_of_replicas: 0 }
	})
	await createIndex('clauses', {
		settings: { number_of_shards: 1, number_of_replicas: 0 }
	})
	// eslint-disable-next-line no-console
	console.log('OpenSearch indices ensured: documents, clauses')
}

main().catch(err => {
	// eslint-disable-next-line no-console
	console.error(err)
	process.exit(1)
})


