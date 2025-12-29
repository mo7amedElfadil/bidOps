"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFrontendUrl = buildFrontendUrl;
function buildFrontendUrl(path) {
    const origin = process.env.WEB_ORIGIN || 'http://localhost:8080';
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${normalized}`;
}
//# sourceMappingURL=frontend-url.js.map