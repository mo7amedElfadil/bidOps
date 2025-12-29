export function parsePagination(
	query: { page?: number | string; pageSize?: number | string },
	defaultPageSize = 50,
	maxPageSize = 200
) {
	const page = Math.max(1, Number(query.page || 1))
	const pageSize = Math.min(maxPageSize, Math.max(1, Number(query.pageSize || defaultPageSize)))
	const skip = (page - 1) * pageSize
	return { page, pageSize, skip }
}
