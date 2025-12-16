import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Page } from '../../components/Page'

export default function AttachmentSearchPage() {
	const [q, setQ] = useState('')
	const { data, isFetching, refetch, isFetched } = useQuery({
		queryKey: ['search', q],
		enabled: false,
		queryFn: () => api.searchAttachments(q.trim())
	})

	function targetLink(row: { entityType: string; entityId: string }) {
		if (row.entityType === 'Opportunity') return `/opportunity/${row.entityId}/attachments`
		return '#'
	}

	return (
		<Page
			title="Search Attachments"
			subtitle="Search across attachment filenames and metadata. Results link to the owning record."
			actions={
				<button
					className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
					onClick={() => refetch()}
					disabled={!q.trim()}
				>
					{isFetching ? 'Searching...' : 'Search'}
				</button>
			}
		>
			<div className="mt-4 rounded border bg-white p-4 shadow-sm">
				<div className="flex flex-wrap items-center gap-3">
					<input
						className="w-full max-w-xl rounded border px-3 py-2 text-sm"
						placeholder="Search filename, tender ref, or entity id"
						value={q}
						onChange={e => setQ(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') refetch()
						}}
					/>
					<span className="text-xs text-slate-600">API: GET /search?q=...</span>
				</div>

				{isFetching && <p className="mt-4 text-sm text-slate-600">Searching...</p>}
				{isFetched && data?.length === 0 && <p className="mt-4 text-sm text-slate-600">No results.</p>}

				{data && data.length > 0 && (
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-3 py-2 text-left">File</th>
									<th className="px-3 py-2 text-left">Entity</th>
									<th className="px-3 py-2 text-left">Size</th>
									<th className="px-3 py-2 text-left">Hash</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{data.map(row => (
									<tr key={row.id} className="border-t">
										<td className="px-3 py-2">{row.filename}</td>
										<td className="px-3 py-2">
											{row.entityType} – {row.entityId}
										</td>
										<td className="px-3 py-2">{(row.size / 1024).toFixed(1)} KB</td>
										<td className="px-3 py-2 font-mono text-xs">{row.hash || '—'}</td>
										<td className="px-3 py-2 text-right">
											<Link
												to={targetLink(row)}
												className="text-blue-600 hover:underline disabled:opacity-50"
											>
												View
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</Page>
	)
}

