"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
let SearchService = SearchService_1 = class SearchService {
    host = process.env.OPENSEARCH_HOST || 'http://localhost:9200';
    logger = new common_1.Logger(SearchService_1.name);
    async onModuleInit() {
        try {
            await this.createIndex();
        }
        catch (e) {
            this.logger.error('Failed to init search index', e);
        }
    }
    async createIndex() {
        const auth = process.env.OPENSEARCH_AUTH;
        const headers = { 'content-type': 'application/json' };
        if (auth) {
            headers['Authorization'] = 'Basic ' + Buffer.from(auth).toString('base64');
        }
        const check = await fetch(`${this.host}/attachments`, { method: 'HEAD', headers });
        if (check.status === 404) {
            this.logger.log('Creating attachments index...');
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
            });
            if (!res.ok)
                throw new Error(await res.text());
        }
    }
    async indexAttachment(doc) {
        const auth = process.env.OPENSEARCH_AUTH;
        const headers = { 'content-type': 'application/json' };
        if (auth)
            headers['Authorization'] = 'Basic ' + Buffer.from(auth).toString('base64');
        try {
            const res = await fetch(`${this.host}/attachments/_doc/${doc.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(doc)
            });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`index error: ${res.status} ${t}`);
            }
        }
        catch (error) {
            this.logger.error('Search index error', error);
            throw error;
        }
    }
    async searchAttachments(query, tenantId) {
        const auth = process.env.OPENSEARCH_AUTH;
        const headers = { 'content-type': 'application/json' };
        if (auth)
            headers['Authorization'] = 'Basic ' + Buffer.from(auth).toString('base64');
        try {
            const res = await fetch(`${this.host}/attachments/_search`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: {
                        bool: {
                            must: [{ multi_match: { query, fields: ['filename^3', 'path', 'hash'] } }],
                            filter: [{ term: { tenantId } }]
                        }
                    }
                })
            });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`search error: ${res.status} ${t}`);
            }
            const json = (await res.json());
            return json.hits?.hits?.map((h) => h._source) || [];
        }
        catch (error) {
            this.logger.error('Search fetch error, returning empty data', error);
            return [];
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)()
], SearchService);
//# sourceMappingURL=search.service.js.map