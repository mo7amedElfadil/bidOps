export declare function parsePagination(query: {
    page?: number | string;
    pageSize?: number | string;
}, defaultPageSize?: number, maxPageSize?: number): {
    page: number;
    pageSize: number;
    skip: number;
};
