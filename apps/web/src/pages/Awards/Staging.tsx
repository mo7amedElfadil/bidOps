import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, AwardStaging } from '../../api/client'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import PaginationControls from '../../components/PaginationControls'
import { normalizeDateInput } from '../../utils/date'

export default function AwardsStagingPage() {
	const [rows, setRows] = useState<AwardStaging[]>([])
	const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number }>({
		page: 1,
		pageSize: 25,
		total: 0
	})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [curating, setCurating] = useState<string | null>(null)
	const [filter, setFilter] = useState({ q: '', status: 'all' })
	const [range, setRange] = useState({ from: '', to: '' })
	const [running, setRunning] = useState(false)
	const [runError, setRunError] = useState<string | null>(null)
	const [runSummary, setRunSummary] = useState<string | null>(null)
	const [editing, setEditing] = useState<AwardStaging | null>(null)
	const [editForm, setEditForm] = useState({
		tenderRef: '',
		client: '',
		title: '',
		awardDate: '',
		awardValue: '',
		winners: '',
		codes: '',
		sourceUrl: '',
		status: 'new'
	})
	const [saving, setSaving] = useState(false)
	const [selected, setSelected] = useState<Record<string, boolean>>({})
	const allSelected = rows.length > 0 && rows.every(row => selected[row.id])

	function toggleSelectAll(checked: boolean) {
		const map: Record<string, boolean> = {}
		rows.forEach(row => {
			map[row.id] = checked
		})
		setSelected(map)
	}

	function toggleRow(id: string, checked: boolean) {
		setSelected(prev => ({ ...prev, [id]: checked }))
	}

	async function load(activeRange?: { from?: string; to?: string }, pageOverride?: number) {
		setLoading(true)
		setError(null)
		try {
			const statusFilter = filter.status !== 'all' ? filter.status : undefined
			const normalizedFrom = normalizeDateInput(activeRange?.from || range.from)
			const normalizedTo = normalizeDateInput(activeRange?.to || range.to)
			const data = await api.listAwardStaging({
				fromDate: normalizedFrom || undefined,
				toDate: normalizedTo || undefined,
				q: filter.q || undefined,
				status: statusFilter,
				page: pageOverride || pagination.page,
				pageSize: pagination.pageSize
			})
			setRows(data.items)
			setPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
			setSelected({})
		} catch (e: any) {
			setError(e.message || 'Failed to load staging awards')
		}
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	async function curate(id: string) {
		setCurating(id)
		setError(null)
		try {
			await api.curateAward(id)
			await load()
		} catch (e: any) {
			setError(e.message || 'Failed to curate record')
		}
		setCurating(null)
	}

	function openEdit(row: AwardStaging) {
		setEditing(row)
		setEditForm({
			tenderRef: row.tenderRef || '',
			client: row.client || '',
			title: row.title || '',
			awardDate: row.awardDate ? row.awardDate.slice(0, 10) : '',
			awardValue: row.awardValue ? String(row.awardValue) : '',
			winners: row.winners?.join(', ') || '',
			codes: row.codes?.join(', ') || '',
			sourceUrl: row.sourceUrl || '',
			status: row.status || 'new'
		})
	}

	async function saveEdit() {
		if (!editing) return
		setSaving(true)
		setError(null)
		try {
			await api.updateAwardStaging(editing.id, {
				tenderRef: editForm.tenderRef || undefined,
				client: editForm.client || undefined,
				title: editForm.title || undefined,
				awardDate: editForm.awardDate || undefined,
				awardValue: editForm.awardValue ? Number(editForm.awardValue) : undefined,
				winners: editForm.winners.split(',').map(w => w.trim()).filter(Boolean),
				codes: editForm.codes.split(',').map(c => c.trim()).filter(Boolean),
				sourceUrl: editForm.sourceUrl || undefined,
				status: editForm.status || undefined
			})
			await load({ from: range.from, to: range.to }, pagination.page)
			setEditing(null)
		} catch (e: any) {
			setError(e.message || 'Failed to update record')
		}
		setSaving(false)
	}

	async function removeRow(id: string) {
		if (!confirm('Delete this staging record?')) return
		setError(null)
		try {
			await api.deleteAwardStaging(id)
			await load({ from: range.from, to: range.to }, pagination.page)
		} catch (e: any) {
			setError(e.message || 'Failed to delete record')
		}
	}

	function getSelectedIds() {
		return Object.entries(selected)
			.filter(([, checked]) => checked)
			.map(([id]) => id)
	}

	async function curateSelected() {
		const ids = getSelectedIds()
		if (!ids.length) return
		setRunError(null)
		setRunSummary(null)
		setCurating('bulk')
		try {
			for (const id of ids) {
				await api.curateAward(id)
			}
			await load({ from: range.from, to: range.to }, 1)
			setRunSummary(`${ids.length} record(s) curated.`)
		} catch (e: any) {
			setRunError(e.message || 'Failed to curate selected records')
		}
		setCurating(null)
	}

	async function deleteSelected() {
		const ids = getSelectedIds()
		if (!ids.length) return
		if (!confirm(`Delete ${ids.length} selected record(s)?`)) return
		setRunError(null)
		setCurating('bulk')
		try {
			for (const id of ids) {
				await api.deleteAwardStaging(id)
			}
			await load({ from: range.from, to: range.to }, 1)
			setRunSummary(`${ids.length} record(s) deleted.`)
		} catch (e: any) {
			setRunError(e.message || 'Failed to delete selected records')
		}
		setCurating(null)
	}

	async function runCollector() {
		setRunning(true)
		setRunError(null)
		setRunSummary(null)
		try {
			const normalizedFrom = normalizeDateInput(range.from)
			const normalizedTo = normalizeDateInput(range.to)
			const res = await api.triggerCollector({
				adapterId: 'monaqasat',
				fromDate: normalizedFrom || undefined,
				toDate: normalizedTo || undefined
			})
			if (res && (res as any).error) {
				setRunError((res as any).error)
			} else {
				const jobId = (res as any)?.jobId
				setRunSummary(
					jobId
						? `Collector job ${jobId} queued. Refresh after the worker signals completion.`
						: 'Collector job queued. Refresh once it finishes.'
				)
				await load({ from: normalizedFrom, to: normalizedTo }, 1)
			}
		} catch (e: any) {
			setRunError(e.message || 'Collector run failed')
		}
		setRunning(false)
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="w-full px-6 py-6">
				<div className="flex items-center justify-between">
					<div>
						<Link to="/opportunities" className="text-sm text-blue-600 hover:underline">
							← Back to Opportunities
						</Link>
						<h1 className="mt-1 text-xl font-semibold">Award Staging</h1>
						<p className="text-sm text-slate-600">Review and curate collected awards before promotion.</p>
					</div>
					<div className="flex gap-2">
						<Link
							to="/awards/events"
							className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
						>
							View Curated
						</Link>
						<Button variant="secondary" size="sm" onClick={() => load(undefined, pagination.page)} disabled={loading}>
							Refresh
						</Button>
					</div>
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-3">
					<Input
						className="w-[280px]"
						placeholder="Search client, title, tender ref"
						value={filter.q}
						onChange={e => {
							setFilter({ ...filter, q: e.target.value })
							setPagination(prev => ({ ...prev, page: 1 }))
						}}
						onKeyDown={e => {
							if (e.key === 'Enter') {
								load({ from: range.from, to: range.to }, 1)
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
						<option value="parsed">parsed</option>
						<option value="curated">curated</option>
					</select>
					<span className="text-sm text-slate-600">Curated: {rows.filter(r => r.status === 'curated').length}</span>
				</div>

				<Card className="mt-4">
					<div className="flex flex-wrap items-end gap-3">
						<div>
							<label className="text-xs font-medium text-slate-600">From date (YYYY-MM-DD)</label>
							<input
								type="date"
								className="mt-1 block w-[160px] rounded border px-3 py-1.5 text-sm"
								value={range.from}
								onChange={e => setRange({ ...range, from: e.target.value })}
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-slate-600">To date (YYYY-MM-DD)</label>
							<input
								type="date"
								className="mt-1 block w-[160px] rounded border px-3 py-1.5 text-sm"
								value={range.to}
								onChange={e => setRange({ ...range, to: e.target.value })}
							/>
						</div>
						<Button variant="primary" size="sm" onClick={runCollector} disabled={running}>
							{running ? 'Running...' : 'Run Monaqasat Collector'}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => load({ from: range.from, to: range.to }, 1)}
							disabled={loading}
						>
							Filter List
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setRange({ from: '', to: '' })
								load(undefined, 1)
							}}
							disabled={loading}
						>
							Clear Filter
						</Button>
						<span className="text-xs text-slate-500">
							Filters apply to award date. Use Filter List to apply to staging view.
						</span>
					</div>
				{runError && <p className="mt-3 text-sm text-red-600">{runError}</p>}
				{runSummary && <p className="mt-3 text-sm text-green-700">{runSummary}</p>}
				{rows.length > 0 && (
					<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
						<Button
							size="sm"
							className="bg-emerald-600 text-white hover:bg-emerald-700"
							onClick={curateSelected}
							disabled={curating === 'bulk' || runSummary === 'No staging records yet.'}
						>
							Curate selected
						</Button>
						<Button variant="danger" size="sm" onClick={deleteSelected} disabled={curating === 'bulk'}>
							Delete selected
						</Button>
						<span className="text-slate-500">
							{getSelectedIds().length} selected
						</span>
					</div>
				)}
				</Card>

				{error && <p className="mt-4 text-sm text-red-600">{error}</p>}
				{loading ? (
					<p className="mt-4 text-sm text-slate-600">Loading...</p>
				) : rows.length === 0 ? (
					<p className="mt-4 text-sm text-slate-600">No staging records found.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-3 py-2 text-left">
										<input
											type="checkbox"
											checked={allSelected}
											onChange={e => toggleSelectAll(e.target.checked)}
										/>
									</th>
									<th className="px-3 py-2 text-left">Portal</th>
									<th className="px-3 py-2 text-left">Tender Ref</th>
									<th className="px-3 py-2 text-left">Client</th>
									<th className="px-3 py-2 text-left">Title</th>
									<th className="px-3 py-2 text-left">Codes</th>
									<th className="px-3 py-2 text-left">Award Date</th>
									<th className="px-3 py-2 text-left">Winners</th>
									<th className="px-3 py-2 text-left">Value</th>
									<th className="px-3 py-2 text-left">Source</th>
									<th className="px-3 py-2 text-left">Status</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{rows.map(r => (
									<tr key={r.id} className="border-t align-top">
										<td className="px-3 py-2">
											<input
												type="checkbox"
												checked={Boolean(selected[r.id])}
												onChange={e => toggleRow(r.id, e.target.checked)}
											/>
										</td>
										<td className="px-3 py-2 font-mono text-xs">{r.portal}</td>
										<td className="px-3 py-2 font-mono text-xs">{r.tenderRef || '-'}</td>
										<td className="px-3 py-2">{r.client || '-'}</td>
										<td className="px-3 py-2 max-w-sm whitespace-pre-wrap">{r.title || '-'}</td>
										<td className="px-3 py-2 text-xs">{r.codes?.join(', ') || '-'}</td>
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
										<td className="px-3 py-2">
											<span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{r.status || 'new'}</span>
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
													className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
													onClick={() => curate(r.id)}
													disabled={curating === r.id}
												>
													{curating === r.id ? 'Curating...' : 'Curate'}
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
				{pagination.total > 0 && (
					<div className="mt-4">
						<PaginationControls
							page={pagination.page}
							pageSize={pagination.pageSize}
							total={pagination.total}
							onPageChange={page => load({ from: range.from, to: range.to }, page)}
							disabled={loading}
						/>
					</div>
				)}
			</div>
			{editing && (
				<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-xl rounded border bg-white p-5 shadow-lg">
						<h2 className="text-lg font-semibold">Edit Staging Record</h2>
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
							<label className="text-sm">
								<span className="font-medium">Status</span>
								<select
									className="mt-1 w-full rounded border px-3 py-2"
									value={editForm.status}
									onChange={e => setEditForm({ ...editForm, status: e.target.value })}
								>
									<option value="new">new</option>
									<option value="parsed">parsed</option>
									<option value="curated">curated</option>
								</select>
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
		</div>
	)
}
