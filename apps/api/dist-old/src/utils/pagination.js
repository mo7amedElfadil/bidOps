"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
function parsePagination(query, defaultPageSize = 50, maxPageSize = 200) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(maxPageSize, Math.max(1, Number(query.pageSize || defaultPageSize)));
    const skip = (page - 1) * pageSize;
    return { page, pageSize, skip };
}
//# sourceMappingURL=pagination.js.map