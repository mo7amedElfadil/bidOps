import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, BusinessRole, MinistryTender, UserAccount } from '../../api/client'
import { normalizeDateInput } from '../../utils/date'
import { getUserRole } from '../../utils/auth'
import { toast } from '../../utils/toast'

export default function AvailableTendersPage() {
	const nav = useNavigate()
	const role = getUserRole()
	const canReview = role === 'ADMIN' || role === 'MANAGER'
	const canPromote = canReview
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
	const [rejectTender, setRejectTender] = useState<MinistryTender | null>(null)
	const [rejectComment, setRejectComment] = useState('')
	const [rejectError, setRejectError] = useState<string | null>(null)
	const [rejectingApproval, setRejectingApproval] = useState(false)
	const [reviewerRoleIds, setReviewerRoleIds] = useState<string[]>([])
	const [reviewerUserIds, setReviewerUserIds] = useState<string[]>([])
	const [businessRoles, setBusinessRoles] = useState<BusinessRole[]>([])
	const [users, setUsers] = useState<UserAccount[]>([])
	const [selected, setSelected] = useState<Record<string, boolean>>({})
	const selectedRows = rows.filter(r => selected[r.id])
	const allSelected = rows.length > 0 && rows.every(r => selected[r.id])
	const goNoGoMeta = (status?: string | null) => {
		switch (status) {
			case 'APPROVED':
				return { label: 'Go/No-Go approved', className: 'bg-emerald-100 text-emerald-800' }
			case 'REJECTED':
				return { label: 'Go/No-Go rejected', className: 'bg-rose-100 text-rose-800' }
			case 'PENDING':
				return { label: 'Awaiting Go/No-Go', className: 'bg-amber-100 text-amber-800' }
			default:
				return { label: 'Not requested', className: 'bg-slate-100 text-slate-600' }
		}
	}

	function toggleAllRows(checked: boolean) {
		const map: Record<string, boolean> = {}
		rows.forEach(r => {
			map[r.id] = checked
		})
		setSelected(map)
	}

	function toggleRowSelect(id: string, checked: boolean) {
		setSelected(prev => ({ ...prev, [id]: checked }))
	}
	const [editingTender, setEditingTender] = useState<MinistryTender | null>(null)
	const [editSaving, setEditSaving] = useState(false)
	const [editError, setEditError] = useState<string | null>(null)
	const [editForm, setEditForm] = useState({
		ministry: '',
		publishDate: '',
		closeDate: '',
		tenderBondValue: '',
		documentsValue: '',
		tenderType: '',
		purchaseUrl: '',
		status: 'new'
	})

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
			setSelected({})
		} catch (e: any) {
			setError(e.message || 'Failed to load tenders')
		}
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	useEffect(() => {
		if (!canReview) return
		api.listBusinessRoles().then(setBusinessRoles).catch(() => {})
		api.listUsers({ pageSize: 200 }).then(data => setUsers(data.items)).catch(() => {})
	}, [canReview])

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
				const jobId = (res as any)?.jobId
				setRunSummary(
					jobId
						? `Collector job ${jobId} queued. Refresh after the worker signals completion.`
						: 'Collector job queued. Refresh once it finishes.'
				)
				await load(1)
			}
		} catch (e: any) {
			setRunError(e.message || 'Collector run failed')
		}
		setRunning(false)
	}

	function openEditModal(tender: MinistryTender) {
		setEditError(null)
		setEditingTender(tender)
		setEditForm({
			ministry: tender.ministry || '',
			publishDate: tender.publishDate ? tender.publishDate.slice(0, 10) : '',
			closeDate: tender.closeDate ? tender.closeDate.slice(0, 10) : '',
			tenderBondValue: tender.tenderBondValue ? String(tender.tenderBondValue) : '',
			documentsValue: tender.documentsValue ? String(tender.documentsValue) : '',
			tenderType: tender.tenderType || '',
			purchaseUrl: tender.purchaseUrl || '',
			status: tender.status || 'new'
		})
	}

	async function saveEdit() {
		if (!editingTender) return
		setEditSaving(true)
		setEditError(null)
		try {
			await api.updateMinistryTender(editingTender.id, {
				ministry: editForm.ministry || undefined,
				publishDate: editForm.publishDate || undefined,
				closeDate: editForm.closeDate || undefined,
				tenderBondValue: editForm.tenderBondValue ? Number(editForm.tenderBondValue) : undefined,
				documentsValue: editForm.documentsValue ? Number(editForm.documentsValue) : undefined,
				tenderType: editForm.tenderType || undefined,
				purchaseUrl: editForm.purchaseUrl || undefined,
				status: editForm.status || undefined
			})
			await load(1)
			setEditingTender(null)
		} catch (e: any) {
			setEditError(e.message || 'Failed to save tender')
		}
		setEditSaving(false)
	}

	function ensureRequiredFields(tender: MinistryTender) {
		if (!tender.ministry?.trim()) {
			setRunError('Ministry is required before promoting or requesting work approval. Please update the record.')
			openEditModal(tender)
			return false
		}
		return true
	}

	async function promote(id: string) {
		if (!canPromote) {
			toast.error('Only managers and admins can promote tenders.')
			return
		}
		setPromoting(id)
		setError(null)
		try {
			const tender = rows.find(r => r.id === id)
			if (!tender || !ensureRequiredFields(tender)) {
				setPromoting(null)
				return
			}
			const opp = await api.promoteMinistryTender(id)
			toast.success('Tender promoted')
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
			if (!ensureRequiredFields(requestTender)) {
				setRequestingApproval(false)
				return
			}
			const res = await api.requestWorkApproval({
				sourceTenderId: requestTender.id,
				comment: requestComment || undefined,
				reviewerUserIds: reviewerUserIds.length ? reviewerUserIds : undefined,
				reviewerRoleIds: reviewerRoleIds.length ? reviewerRoleIds : undefined
			})
			setRequestTender(null)
			setRequestComment('')
			setReviewerRoleIds([])
			setReviewerUserIds([])
			await load()
			nav(`/opportunity/${res.opportunity.id}`)
		} catch (e: any) {
			setRequestError(e.message || 'Failed to request approval')
		}
		setRequestingApproval(false)
	}

	async function submitRejectApproval() {
		if (!rejectTender) return
		setRejectingApproval(true)
		setRejectError(null)
		try {
			await api.rejectWorkApproval({
				sourceTenderId: rejectTender.id,
				comment: rejectComment || undefined
			})
			setRejectTender(null)
			setRejectComment('')
			await load()
		} catch (e: any) {
			setRejectError(e.message || 'Failed to reject tender')
		}
		setRejectingApproval(false)
	}

	async function deleteSelectedTenders() {
		const ids = Object.entries(selected).filter(([, checked]) => checked).map(([id]) => id)
		if (!ids.length) return
		if (!confirm(`Delete ${ids.length} selected tender(s)?`)) return
		setError(null)
		try {
			for (const id of ids) {
				await api.deleteMinistryTender(id)
			}
			await load(1)
		} catch (e: any) {
			setError(e.message || 'Failed to delete selected tenders')
		}
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="w-full px-6 py-6">
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
					{selectedRows.length > 0 && (
						<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
							<button
								className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-60"
								onClick={deleteSelectedTenders}
								disabled={running}
							>
								Delete selected ({selectedRows.length})
							</button>
						</div>
					)}
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
									<th className="px-3 py-2 text-left">
										<input
											type="checkbox"
											checked={allSelected}
											onChange={e => toggleAllRows(e.target.checked)}
										/>
									</th>
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
									<th className="px-3 py-2 text-left">Go/No-Go</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{rows.map(row => {
									const goNoGo = goNoGoMeta(row.goNoGoStatus)
									const hasOpportunity = Boolean(row.opportunityId)
									const approvalPending = row.goNoGoStatus === 'PENDING'
									const approvalRejected = row.goNoGoStatus === 'REJECTED'
									const approvalApproved = row.goNoGoStatus === 'APPROVED'
									return (
										<tr key={row.id} className="border-t align-top">
										<td className="px-3 py-2">
											<input
												type="checkbox"
												checked={Boolean(selected[row.id])}
												onChange={e => toggleRowSelect(row.id, e.target.checked)}
											/>
										</td>
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
										<td className="px-3 py-2">
											<span className={`rounded px-2 py-0.5 text-xs ${goNoGo.className}`}>{goNoGo.label}</span>
										</td>
										<td className="px-3 py-2 text-right">
											<div className="flex flex-col items-end gap-2">
												{canReview && (
													<>
														<button
															className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
															onClick={() => {
																setRequestTender(row)
																setRequestComment('')
																setRequestError(null)
															}}
															disabled={requestingApproval || approvalPending || approvalApproved}
														>
															{approvalPending
																? 'Approval pending'
																: approvalApproved
																	? 'Approval granted'
																	: approvalRejected
																		? 'Request again'
																		: 'Request Approval'}
														</button>
														<button
															className="rounded bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-50"
															onClick={() => {
																setRejectTender(row)
																setRejectComment('')
																setRejectError(null)
															}}
															disabled={rejectingApproval || approvalApproved}
														>
															Reject
														</button>
													</>
												)}
												{hasOpportunity && (
													<button
														className="rounded bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800"
														onClick={() => nav(`/opportunity/${row.opportunityId}`)}
													>
														Open Opportunity
													</button>
												)}
												<button
													className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
													onClick={() => promote(row.id)}
													disabled={!canPromote || promoting === row.id || row.status === 'promoted' || hasOpportunity}
												>
													{promoting === row.id ? 'Promoting...' : 'Promote'}
												</button>
												<button
													className="rounded bg-slate-200 px-3 py-1 text-xs hover:bg-slate-300"
													onClick={() => openEditModal(row)}
												>
													Edit
												</button>
											</div>
										</td>
									</tr>
									)
								})}
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
						<h2 className="text-lg font-semibold">Request Approval</h2>
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
						<label className="mt-4 block text-xs font-medium text-slate-600">Reviewers (Users)</label>
						<select
							multiple
							className="mt-1 w-full rounded border p-2 text-sm"
							value={reviewerUserIds}
							onChange={e => {
								const selected = Array.from(e.target.selectedOptions).map(opt => opt.value)
								setReviewerUserIds(selected)
							}}
						>
							{users.map(user => (
								<option key={user.id} value={user.id}>
									{user.name} ({user.email})
								</option>
							))}
						</select>
						<label className="mt-4 block text-xs font-medium text-slate-600">Reviewers (Business Roles)</label>
						<select
							multiple
							className="mt-1 w-full rounded border p-2 text-sm"
							value={reviewerRoleIds}
							onChange={e => {
								const selected = Array.from(e.target.selectedOptions).map(opt => opt.value)
								setReviewerRoleIds(selected)
							}}
						>
							{businessRoles.map(role => (
								<option key={role.id} value={role.id}>
									{role.name}
								</option>
							))}
						</select>
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
			{rejectTender && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-lg rounded border bg-white p-5 shadow-lg">
						<h2 className="text-lg font-semibold">Reject Tender</h2>
						<p className="mt-1 text-sm text-slate-600">
							Provide a short note before rejecting this tender.
						</p>
						<div className="mt-4 rounded border bg-slate-50 p-3 text-sm">
							<p className="font-medium">{rejectTender.title || rejectTender.tenderRef}</p>
							<p className="text-slate-600">{rejectTender.ministry || 'Unknown ministry'}</p>
						</div>
						<label className="mt-4 block text-xs font-medium text-slate-600">Reason (optional)</label>
						<textarea
							className="mt-1 w-full rounded border p-2 text-sm"
							rows={4}
							value={rejectComment}
							onChange={e => setRejectComment(e.target.value)}
							placeholder="Why are we rejecting this tender?"
						/>
						{rejectError && <p className="mt-2 text-sm text-red-600">{rejectError}</p>}
						<div className="mt-4 flex items-center justify-end gap-2">
							<button
								className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
								onClick={() => setRejectTender(null)}
								disabled={rejectingApproval}
							>
								Cancel
							</button>
							<button
								className="rounded bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
								onClick={submitRejectApproval}
								disabled={rejectingApproval}
							>
								{rejectingApproval ? 'Rejecting...' : 'Reject tender'}
							</button>
						</div>
					</div>
				</div>
			)}
			{editingTender && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-lg space-y-3 rounded border bg-white p-5 shadow-lg">
						<h2 className="text-lg font-semibold">Edit Tender</h2>
						<div className="grid gap-3">
							<label className="text-sm">
								<span className="font-medium">Ministry / Buyer</span>
								<input
									value={editForm.ministry}
									onChange={e => setEditForm({ ...editForm, ministry: e.target.value })}
									className="mt-1 w-full rounded border px-3 py-2"
								/>
							</label>
							<div className="grid gap-3 md:grid-cols-2">
								<label className="text-sm">
									<span className="font-medium">Publish date</span>
									<input
										type="date"
										value={editForm.publishDate}
										onChange={e => setEditForm({ ...editForm, publishDate: e.target.value })}
										className="mt-1 w-full rounded border px-3 py-2"
									/>
								</label>
								<label className="text-sm">
									<span className="font-medium">Close date</span>
									<input
										type="date"
										value={editForm.closeDate}
										onChange={e => setEditForm({ ...editForm, closeDate: e.target.value })}
										className="mt-1 w-full rounded border px-3 py-2"
									/>
								</label>
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								<label className="text-sm">
									<span className="font-medium">Bond value</span>
									<input
										type="number"
										value={editForm.tenderBondValue}
										onChange={e => setEditForm({ ...editForm, tenderBondValue: e.target.value })}
										className="mt-1 w-full rounded border px-3 py-2"
									/>
								</label>
								<label className="text-sm">
									<span className="font-medium">Documents value</span>
									<input
										type="number"
										value={editForm.documentsValue}
										onChange={e => setEditForm({ ...editForm, documentsValue: e.target.value })}
										className="mt-1 w-full rounded border px-3 py-2"
									/>
								</label>
							</div>
							<label className="text-sm">
								<span className="font-medium">Tender type</span>
								<input
									value={editForm.tenderType}
									onChange={e => setEditForm({ ...editForm, tenderType: e.target.value })}
									className="mt-1 w-full rounded border px-3 py-2"
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Purchase URL</span>
								<input
									value={editForm.purchaseUrl}
									onChange={e => setEditForm({ ...editForm, purchaseUrl: e.target.value })}
									className="mt-1 w-full rounded border px-3 py-2"
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Status</span>
								<select
									value={editForm.status}
									onChange={e => setEditForm({ ...editForm, status: e.target.value })}
									className="mt-1 w-full rounded border px-3 py-2"
								>
									<option value="new">new</option>
									<option value="promoted">promoted</option>
									<option value="requested">requested</option>
								</select>
							</label>
						</div>
						{editError && <p className="text-sm text-red-600">{editError}</p>}
						<div className="flex justify-end gap-2">
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
								onClick={() => setEditingTender(null)}
								disabled={editSaving}
							>
								Cancel
							</button>
							<button
								className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
								onClick={saveEdit}
								disabled={editSaving}
							>
								{editSaving ? 'Saving...' : 'Save changes'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
