import { Injectable, OnModuleInit, Logger } from '@nestjs/common'

@Injectable()
export class SearchService implements OnModuleInit {
	private host = process.env.OPENSEARCH_HOST || 'http://localhost:9200'
    private logger = new Logger(SearchService.name)

    async onModuleInit() {
        try {
            await this.createIndex()
        } catch (e) {
            this.logger.error('Failed to init search index', e)
        }
    }

    private async createIndex() {
        // Check if index exists
        // In local environments without strict SSL/TLS or auth, this fetch should work
        // If basic auth is needed (OpenSearch usually defaults to admin:admin), we might need to add headers
        const auth = process.env.OPENSEARCH_AUTH // e.g., 'admin:admin'
        const headers: any = { 'content-type': 'application/json' }
        if (auth) {
            headers['Authorization'] = 'Basic ' + Buffer.from(auth).toString('base64')
        }

        const check = await fetch(`${this.host}/attachments`, { method: 'HEAD', headers })
        if (check.status === 404) {
            this.logger.log('Creating attachments index...')
            const res = await fetch(`${this.host}/attachments`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    mappings: {
                        properties: {
                            filename: { type: 'text' },
                            path: { type: 'keyword' },
                            tenantId: { type: 'keyword' },
                            createdAt: { type: 'date' }
                        }
                    }
                })
            })
            if (!res.ok) throw new Error(await res.text())
        }
    }

	async indexAttachment(doc: { id: string; filename: string; path: string; size: number; hash: string; createdAt: string; tenantId: string }) {
        const auth = process.env.OPENSEARCH_AUTH 
        const headers: any = { 'content-type': 'application/json' }
        if (auth) headers['Authorization'] = 'Basic ' + Buffer.from(auth).toString('base64')

		const res = await fetch(`${this.host}/attachments/_doc/${doc.id}`, {
			method: 'PUT',
			headers,
			body: JSON.stringify(doc)
		})
		if (!res.ok) {
			const t = await res.text()
			throw new Error(`index error: ${res.status} ${t}`)
		}
	}

	async searchAttachments(query: string, tenantId: string) {
        const auth = process.env.OPENSEARCH_AUTH 
        const headers: any = { 'content-type': 'application/json' }
        if (auth) headers['Authorization'] = 'Basic ' + Buffer.from(auth).toString('base64')

		const res = await fetch(`${this.host}/attachments/_search`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				query: {
					bool: {
						must: [
							{ multi_match: { query, fields: ['filename^3', 'path', 'hash'] } }
						],
						filter: [{ term: { tenantId } }]
					}
				}
			})
		})
		if (!res.ok) {
			const t = await res.text()
			throw new Error(`search error: ${res.status} ${t}`)
		}
		const json = (await res.json()) as any
		return json.hits?.hits?.map((h: any) => h._source) || []
	}
}
