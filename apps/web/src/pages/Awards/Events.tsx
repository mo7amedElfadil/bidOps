import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, AwardEvent } from '../../api/client'

export default function AwardsEventsPage() {
	const [rows, setRows] = useState<AwardEvent[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState({ q: '' })

	async function load() {
		setLoading(true)
		setError(null)
		try {
			const data = await api.listAwardEvents()
			setRows(data)
		} catch (e: any) {
			setError(e.message || 'Failed to load awards')
		}
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	const filtered = rows.filter(r => {
		const q = filter.q.toLowerCase()
		return (
			!q ||
			r.tenderRef?.toLowerCase().includes(q) ||
			r.buyer?.toLowerCase().includes(q) ||
			r.title?.toLowerCase().includes(q)
		)
	})

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="mx-auto max-w-6xl p-6">
				<div className="flex items-center justify-between">
					<div>
						<Link to="/" className="text-sm text-blue-600 hover:underline">
							← Back to Opportunities
						</Link>
						<h1 className="mt-1 text-xl font-semibold">Curated Awards</h1>
						<p className="text-sm text-slate-600">Awards promoted from staging and ready for analytics.</p>
					</div>
					<div className="flex gap-2">
						<Link
							to="/awards/staging"
							className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
						>
							View Staging
						</Link>
						<a href={`${import.meta.env.VITE_API_URL}/analytics/export/awards.csv`} download className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 flex items-center">Export CSV</a>
						<button
							className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
							onClick={load}
							disabled={loading}
						>
							Refresh
						</button>
					</div>
				</div>

				<div className="mt-3 flex flex-wrap gap-3">
					<input
						className="rounded border px-3 py-1.5 text-sm"
						placeholder="Search buyer, title, tender ref"
						value={filter.q}
						onChange={e => setFilter({ q: e.target.value })}
					/>
				</div>

				{error && <p className="mt-4 text-sm text-red-600">{error}</p>}
				{loading ? (
					<p className="mt-4 text-sm text-slate-600">Loading...</p>
				) : filtered.length === 0 ? (
					<p className="mt-4 text-sm text-slate-600">No curated awards yet.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-3 py-2 text-left">Portal</th>
									<th className="px-3 py-2 text-left">Tender Ref</th>
									<th className="px-3 py-2 text-left">Buyer</th>
									<th className="px-3 py-2 text-left">Title</th>
									<th className="px-3 py-2 text-left">Award Date</th>
									<th className="px-3 py-2 text-left">Winners</th>
									<th className="px-3 py-2 text-left">Value</th>
									<th className="px-3 py-2 text-left">Source</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map(r => (
									<tr key={r.id} className="border-t align-top">
										<td className="px-3 py-2 font-mono text-xs">{r.portal}</td>
										<td className="px-3 py-2 font-mono text-xs">{r.tenderRef || '-'}</td>
										<td className="px-3 py-2">{r.buyer || '-'}</td>
										<td className="px-3 py-2 max-w-sm whitespace-pre-wrap">{r.title || '-'}</td>
										<td className="px-3 py-2">{r.awardDate?.slice(0, 10) || '-'}</td>
										<td className="px-3 py-2 text-xs">{r.winners?.join(', ') || '-'}</td>
										<td className="px-3 py-2">
											{r.awardValue ? r.awardValue.toLocaleString() : '-'}
										</td>
										<td className="px-3 py-2 text-xs">
											{r.sourceUrl ? (
												<a className="text-blue-600 hover:underline" href={r.sourceUrl} target="_blank" rel="noreferrer">
													Link
												</a>
											) : (
												'—'
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}

