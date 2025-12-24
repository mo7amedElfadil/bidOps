import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, MinistryTender } from '../../api/client'
import { normalizeDateInput } from '../../utils/date'

export default function AvailableTendersPage() {
	const nav = useNavigate()
	const [rows, setRows] = useState<MinistryTender[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState({ q: '', status: 'all' })
	const [running, setRunning] = useState(false)
	const [runError, setRunError] = useState<string | null>(null)
	const [runSummary, setRunSummary] = useState<string | null>(null)
	const [promoting, setPromoting] = useState<string | null>(null)
	const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 })
	const [pageInput, setPageInput] = useState('1')
	const [fromDate, setFromDate] = useState('')
	const [toDate, setToDate] = useState('')
	const [requestTender, setRequestTender] = useState<MinistryTender | null>(null)
	const [requestComment, setRequestComment] = useState('')
	const [requestError, setRequestError] = useState<string | null>(null)
	const [requestingApproval, setRequestingApproval] = useState(false)

	async function load(pageOverride?: number) {
		setLoading(true)
		setError(null)
		try {
			const normalizedFrom = normalizeDateInput(fromDate)
			const normalizedTo = normalizeDateInput(toDate)
			const data = await api.listMinistryTenders({
				q: filter.q || undefined,
				status: filter.status !== 'all' ? filter.status : undefined,
				fromDate: normalizedFrom || undefined,
				toDate: normalizedTo || undefined,
				page: pageOverride || pagination.page,
				pageSize: pagination.pageSize
			})
			setRows(data.items)
			setPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
			setPageInput(String(data.page))
		} catch (e: any) {
			setError(e.message || 'Failed to load tenders')
		}
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	async function runCollector() {
		setRunning(true)
		setRunError(null)
		setRunSummary(null)
		try {
			const normalizedFrom = normalizeDateInput(fromDate)
			const normalizedTo = normalizeDateInput(toDate)
			const res = await api.triggerTenderCollector({
				adapterId: 'monaqasat_available',
				fromDate: normalizedFrom || undefined,
				toDate: normalizedTo || undefined
			})
			if (res && (res as any).error) {
				setRunError((res as any).error)
			} else {
				setRunSummary('Collector run completed. Refresh to see new records.')
				await load(1)
			}
		} catch (e: any) {
			setRunError(e.message || 'Collector run failed')
		}
		setRunning(false)
	}

	async function promote(id: string) {
		setPromoting(id)
		setError(null)
		try {
			const opp = await api.promoteMinistryTender(id)
			await load()
			nav(`/opportunity/${opp.id}`)
		} catch (e: any) {
			setError(e.message || 'Failed to promote tender')
		}
		setPromoting(null)
	}

	async function submitWorkApproval() {
		if (!requestTender) return
		setRequestingApproval(true)
		setRequestError(null)
		try {
			const res = await api.requestWorkApproval({
				sourceTenderId: requestTender.id,
				comment: requestComment || undefined
			})
			setRequestTender(null)
			setRequestComment('')
			await load()
			nav(`/opportunity/${res.opportunity.id}`)
		} catch (e: any) {
			setRequestError(e.message || 'Failed to request approval')
		}
		setRequestingApproval(false)
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="mx-auto max-w-6xl p-6">
				<div className="flex items-center justify-between">
					<div>
						<Link to="/" className="text-sm text-blue-600 hover:underline">
							← Back to Opportunities
						</Link>
						<h1 className="mt-1 text-xl font-semibold">Available Ministry Tenders</h1>
						<p className="text-sm text-slate-600">Review tenders from Monaqasat and promote to opportunities.</p>
					</div>
					<div className="flex gap-2">
						<button
							className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
							onClick={() => load(pagination.page)}
							disabled={loading}
						>
							Refresh
						</button>
					</div>
				</div>


				<div className="mt-4 rounded border bg-white p-4 shadow-sm">
					<div className="flex flex-wrap items-end gap-4">
						<div>
							<label className="text-xs font-medium text-slate-600">From date (UTC+3, YYYY-MM-DD)</label>
							<input
								type="date"
								className="mt-1 block h-10 w-[180px] rounded border px-3 py-1.5 text-sm"
								value={fromDate}
								onChange={e => setFromDate(e.target.value)}
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-slate-600">To date (YYYY-MM-DD)</label>
							<input
								type="date"
								className="mt-1 block h-10 w-[180px] rounded border px-3 py-1.5 text-sm"
								value={toDate}
								onChange={e => setToDate(e.target.value)}
							/>
						</div>
						<button
							className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
							onClick={runCollector}
							disabled={running}
						>
							{running ? 'Running...' : 'Run Monaqasat Collector'}
						</button>
						<button
							className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
							onClick={() => load(1)}
							disabled={loading}
						>
							Filter List
						</button>
						<span className="text-xs text-slate-500">Filters apply to publish/close dates.</span>
					</div>
					{runError && <p className="mt-3 text-sm text-red-600">{runError}</p>}
					{runSummary && <p className="mt-3 text-sm text-green-700">{runSummary}</p>}
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-3">
					<input
						className="rounded border px-3 py-1.5 text-sm"
						placeholder="Search tender ref, ministry, title"
						value={filter.q}
						onChange={e => {
							setFilter({ ...filter, q: e.target.value })
							setPagination(prev => ({ ...prev, page: 1 }))
						}}
						onKeyDown={e => {
							if (e.key === 'Enter') {
								load(1)
							}
						}}
					/>
					<select
						className="rounded border px-3 py-1.5 text-sm"
						value={filter.status}
						onChange={e => {
							setFilter({ ...filter, status: e.target.value })
							setPagination(prev => ({ ...prev, page: 1 }))
						}}
					>
						<option value="all">All</option>
						<option value="new">new</option>
						<option value="promoted">promoted</option>
					</select>
					<button
						className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
						onClick={() => load(1)}
						disabled={loading}
					>
						Apply Filters
					</button>
				</div>
				{error && <p className="mt-3 text-sm text-red-600">{error}</p>}

				{loading ? (
					<p className="mt-4 text-sm text-slate-600">Loading...</p>
				) : rows.length === 0 ? (
					<p className="mt-4 text-sm text-slate-600">No tenders found.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-3 py-2 text-left">Tender Ref</th>
									<th className="px-3 py-2 text-left">Title</th>
									<th className="px-3 py-2 text-left">Ministry</th>
									<th className="px-3 py-2 text-left">Publish</th>
									<th className="px-3 py-2 text-left">Close</th>
									<th className="px-3 py-2 text-left">Bond</th>
									<th className="px-3 py-2 text-left">Docs</th>
									<th className="px-3 py-2 text-left">Type</th>
									<th className="px-3 py-2 text-left">Purchase</th>
									<th className="px-3 py-2 text-left">Status</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{rows.map(row => (
									<tr key={row.id} className="border-t align-top">
										<td className="px-3 py-2 font-mono text-xs">{row.tenderRef || '-'}</td>
										<td className="px-3 py-2 max-w-sm whitespace-pre-wrap">{row.title || '-'}</td>
										<td className="px-3 py-2">{row.ministry || '-'}</td>
										<td className="px-3 py-2">{row.publishDate?.slice(0, 10) || '-'}</td>
										<td className="px-3 py-2">{row.closeDate?.slice(0, 10) || '-'}</td>
										<td className="px-3 py-2 text-xs">
											{row.tenderBondValue ? row.tenderBondValue.toLocaleString() : '-'}
										</td>
										<td className="px-3 py-2 text-xs">
											{row.documentsValue ? row.documentsValue.toLocaleString() : '-'}
										</td>
										<td className="px-3 py-2 text-xs">{row.tenderType || '-'}</td>
										<td className="px-3 py-2 text-xs">
											{row.purchaseUrl ? (
												<a
													className="text-blue-600 hover:underline"
													href={row.purchaseUrl}
													target="_blank"
													rel="noreferrer"
												>
													Link
												</a>
											) : (
												'—'
											)}
										</td>
										<td className="px-3 py-2">
											<span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{row.status || 'new'}</span>
										</td>
										<td className="px-3 py-2 text-right">
											<div className="flex flex-col items-end gap-2">
												<button
													className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
													onClick={() => {
														setRequestTender(row)
														setRequestComment('')
														setRequestError(null)
													}}
													disabled={requestingApproval}
												>
													Request Work Approval
												</button>
												<button
													className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
													onClick={() => promote(row.id)}
													disabled={promoting === row.id || row.status === 'promoted'}
												>
													{promoting === row.id ? 'Promoting...' : 'Promote'}
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{pagination.total > 0 && (
					<div className="mt-4 flex items-center justify-between text-sm text-slate-600">
						<span>
							Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
						</span>
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-2">
								<span className="text-xs text-slate-500">Go to</span>
								<input
									type="number"
									min={1}
									max={Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
									className="w-20 rounded border px-2 py-1 text-sm"
									value={pageInput}
									onChange={e => setPageInput(e.target.value)}
									onKeyDown={e => {
										if (e.key === 'Enter') {
											const maxPage = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
											const nextPage = Math.min(maxPage, Math.max(1, Number(pageInput || 1)))
											load(nextPage)
										}
									}}
								/>
								<button
									className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 disabled:opacity-50"
									onClick={() => {
										const maxPage = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
										const nextPage = Math.min(maxPage, Math.max(1, Number(pageInput || 1)))
										load(nextPage)
									}}
									disabled={loading}
								>
									Go
								</button>
							</div>
							<button
								className="rounded bg-slate-100 px-3 py-1.5 hover:bg-slate-200 disabled:opacity-50"
								onClick={() => load(Math.max(1, pagination.page - 1))}
								disabled={pagination.page <= 1}
							>
								Prev
							</button>
							<button
								className="rounded bg-slate-100 px-3 py-1.5 hover:bg-slate-200 disabled:opacity-50"
								onClick={() => {
									const maxPage = Math.ceil(pagination.total / pagination.pageSize)
									load(Math.min(maxPage, pagination.page + 1))
								}}
								disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>
			{requestTender && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-lg rounded border bg-white p-5 shadow-lg">
						<h2 className="text-lg font-semibold">Request Go/No-Go Approval</h2>
						<p className="mt-1 text-sm text-slate-600">
							Provide a brief rationale before sending this tender for managerial approval.
						</p>
						<div className="mt-4 rounded border bg-slate-50 p-3 text-sm">
							<p className="font-medium">{requestTender.title || requestTender.tenderRef}</p>
							<p className="text-slate-600">{requestTender.ministry || 'Unknown ministry'}</p>
						</div>
						<label className="mt-4 block text-xs font-medium text-slate-600">Rationale (optional)</label>
						<textarea
							className="mt-1 w-full rounded border p-2 text-sm"
							rows={4}
							value={requestComment}
							onChange={e => setRequestComment(e.target.value)}
							placeholder="Why should we pursue this tender?"
						/>
						{requestError && <p className="mt-2 text-sm text-red-600">{requestError}</p>}
						<div className="mt-4 flex items-center justify-end gap-2">
							<button
								className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
								onClick={() => setRequestTender(null)}
								disabled={requestingApproval}
							>
								Cancel
							</button>
							<button
								className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
								onClick={submitWorkApproval}
								disabled={requestingApproval}
							>
								{requestingApproval ? 'Submitting...' : 'Send Request'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
