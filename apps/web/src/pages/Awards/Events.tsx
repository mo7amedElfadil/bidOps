import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, AwardEvent } from '../../api/client'
import { downloadWithAuth } from '../../utils/download'
import { normalizeDateInput } from '../../utils/date'

export default function AwardsEventsPage() {
	const [rows, setRows] = useState<AwardEvent[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState({ q: '' })
	const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 })
	const [pageInput, setPageInput] = useState('1')
	const [editing, setEditing] = useState<AwardEvent | null>(null)
	const [editForm, setEditForm] = useState({
		tenderRef: '',
		client: '',
		title: '',
		awardDate: '',
		awardValue: '',
		winners: '',
		codes: '',
		sourceUrl: ''
	})
	const [saving, setSaving] = useState(false)

	async function load(pageOverride?: number) {
		setLoading(true)
		setError(null)
		try {
			const data = await api.listAwardEvents({
				page: pageOverride || pagination.page,
				pageSize: pagination.pageSize,
				q: filter.q || undefined
			})
			setRows(data.items)
			setPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
			setPageInput(String(data.page))
		} catch (e: any) {
			setError(e.message || 'Failed to load awards')
		}
		setLoading(false)
	}

	function handleSearch() {
		setPagination(prev => ({ ...prev, page: 1 }))
		load(1)
	}

	function openEdit(row: AwardEvent) {
		setEditing(row)
		setEditForm({
			tenderRef: row.tenderRef || '',
			client: row.client || '',
			title: row.title || '',
			awardDate: row.awardDate ? row.awardDate.slice(0, 10) : '',
			awardValue: row.awardValue ? String(row.awardValue) : '',
			winners: row.winners?.join(', ') || '',
			codes: row.codes?.join(', ') || '',
			sourceUrl: row.sourceUrl || ''
		})
	}

	async function saveEdit() {
		if (!editing) return
		setSaving(true)
		setError(null)
		try {
			const normalizedAwardDate = normalizeDateInput(editForm.awardDate)
			await api.updateAwardEvent(editing.id, {
				tenderRef: editForm.tenderRef || undefined,
				client: editForm.client || undefined,
				title: editForm.title || undefined,
				awardDate: normalizedAwardDate || undefined,
				awardValue: editForm.awardValue ? Number(editForm.awardValue) : undefined,
				winners: editForm.winners.split(',').map(w => w.trim()).filter(Boolean),
				codes: editForm.codes.split(',').map(c => c.trim()).filter(Boolean),
				sourceUrl: editForm.sourceUrl || undefined
			})
			await load(pagination.page)
			setEditing(null)
		} catch (e: any) {
			setError(e.message || 'Failed to update record')
		}
		setSaving(false)
	}

	async function removeRow(id: string) {
		if (!confirm('Delete this award event?')) return
		setError(null)
		try {
			await api.deleteAwardEvent(id)
			await load(pagination.page)
		} catch (e: any) {
			setError(e.message || 'Failed to delete record')
		}
	}

	useEffect(() => {
		load()
	}, [])

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="w-full px-6 py-6">
				<div className="flex items-center justify-between">
					<div>
						<Link to="/opportunities" className="text-sm text-blue-600 hover:underline">
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
						<button
							className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 flex items-center"
							onClick={() =>
								downloadWithAuth(
									`${import.meta.env.VITE_API_URL}/analytics/export/awards.csv`,
									`awards.csv`
								)
							}
						>
							Export CSV
						</button>
						<button
							className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
							onClick={() => load(pagination.page)}
							disabled={loading}
						>
							Refresh
						</button>
					</div>
				</div>

				<div className="mt-3 flex flex-wrap gap-3">
					<input
						className="rounded border px-3 py-1.5 text-sm"
						placeholder="Search client, title, tender ref"
						value={filter.q}
						onChange={e => {
							setFilter({ q: e.target.value })
							setPagination(prev => ({ ...prev, page: 1 }))
						}}
						onKeyDown={e => {
							if (e.key === 'Enter') {
								handleSearch()
							}
						}}
					/>
					<button
						className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 disabled:opacity-50"
						onClick={handleSearch}
						disabled={loading}
					>
						Search
					</button>
				</div>

				{error && <p className="mt-4 text-sm text-red-600">{error}</p>}
				{loading ? (
					<p className="mt-4 text-sm text-slate-600">Loading...</p>
				) : rows.length === 0 ? (
					<p className="mt-4 text-sm text-slate-600">No curated awards yet.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-3 py-2 text-left">Portal</th>
									<th className="px-3 py-2 text-left">Tender Ref</th>
									<th className="px-3 py-2 text-left">Client</th>
									<th className="px-3 py-2 text-left">Title</th>
									<th className="px-3 py-2 text-left">Award Date</th>
									<th className="px-3 py-2 text-left">Winners</th>
									<th className="px-3 py-2 text-left">Value</th>
									<th className="px-3 py-2 text-left">Source</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{rows.map(r => (
									<tr key={r.id} className="border-t align-top">
										<td className="px-3 py-2 font-mono text-xs">{r.portal}</td>
										<td className="px-3 py-2 font-mono text-xs">{r.tenderRef || '-'}</td>
										<td className="px-3 py-2">{r.client || '-'}</td>
										<td className="px-3 py-2 max-w-sm whitespace-pre-wrap">{r.title || '-'}</td>
										<td className="px-3 py-2">{r.awardDate?.slice(0, 10) || '-'}</td>
										<td className="px-3 py-2 text-xs">{r.winners?.join(', ') || '-'}</td>
										<td className="px-3 py-2">
											{r.awardValue ? r.awardValue.toLocaleString() : '-'}
										</td>
										<td className="px-3 py-2 text-xs">
											{r.sourceUrl ? (
												<a
													className="text-blue-600 hover:underline"
													href={r.sourceUrl}
													target="_blank"
													rel="noreferrer"
												>
													Link
												</a>
											) : (
												'—'
											)}
										</td>
										<td className="px-3 py-2 text-right">
											<div className="flex justify-end gap-2">
												<button
													className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
													onClick={() => openEdit(r)}
												>
													Edit
												</button>
												<button
													className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
													onClick={() => removeRow(r.id)}
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{editing && (
					<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
						<div className="w-full max-w-xl rounded border bg-white p-5 shadow-lg">
							<h2 className="text-lg font-semibold">Edit Award Event</h2>
							<div className="mt-3 grid gap-3">
								<label className="text-sm">
									<span className="font-medium">Tender Ref</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.tenderRef}
										onChange={e => setEditForm({ ...editForm, tenderRef: e.target.value })}
									/>
								</label>
								<label className="text-sm">
									<span className="font-medium">Client</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.client}
										onChange={e => setEditForm({ ...editForm, client: e.target.value })}
									/>
								</label>
								<label className="text-sm">
									<span className="font-medium">Title</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.title}
										onChange={e => setEditForm({ ...editForm, title: e.target.value })}
									/>
								</label>
								<div className="grid gap-3 md:grid-cols-2">
									<label className="text-sm">
										<span className="font-medium">Award Date</span>
										<input
											type="date"
											className="mt-1 w-full rounded border px-3 py-2"
											value={editForm.awardDate}
											onChange={e => setEditForm({ ...editForm, awardDate: e.target.value })}
										/>
									</label>
									<label className="text-sm">
										<span className="font-medium">Award Value</span>
										<input
											className="mt-1 w-full rounded border px-3 py-2"
											value={editForm.awardValue}
											onChange={e => setEditForm({ ...editForm, awardValue: e.target.value })}
										/>
									</label>
								</div>
								<label className="text-sm">
									<span className="font-medium">Winners (comma separated)</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.winners}
										onChange={e => setEditForm({ ...editForm, winners: e.target.value })}
									/>
								</label>
								<label className="text-sm">
									<span className="font-medium">Codes (comma separated)</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.codes}
										onChange={e => setEditForm({ ...editForm, codes: e.target.value })}
									/>
								</label>
								<label className="text-sm">
									<span className="font-medium">Source URL</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.sourceUrl}
										onChange={e => setEditForm({ ...editForm, sourceUrl: e.target.value })}
									/>
								</label>
							</div>
							<div className="mt-4 flex justify-end gap-2">
								<button
									className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
									onClick={() => setEditing(null)}
									disabled={saving}
								>
									Cancel
								</button>
								<button
									className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
									onClick={saveEdit}
									disabled={saving}
								>
									{saving ? 'Saving...' : 'Save'}
								</button>
							</div>
						</div>
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
		</div>
	)
}
