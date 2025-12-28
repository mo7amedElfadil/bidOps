import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, BusinessRole, MinistryTender, UserAccount } from '../../api/client'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import PaginationControls from '../../components/PaginationControls'
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
				return { label: 'Go/No-Go approved', className: 'bg-green-500/10 text-green-600' }
			case 'REJECTED':
				return { label: 'Go/No-Go rejected', className: 'bg-rose-100 text-rose-800' }
			case 'PENDING':
				return { label: 'Awaiting Go/No-Go', className: 'bg-amber-500/10 text-amber-600' }
			default:
				return { label: 'Not requested', className: 'bg-muted text-muted-foreground' }
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
		<div className="min-h-screen bg-muted text-foreground">
			<div className="w-full px-6 py-6">
				<div className="flex items-center justify-between">
					<div>
						<Link to="/opportunities" className="text-sm text-accent hover:underline">
							← Back to Opportunities
						</Link>
						<h1 className="mt-1 text-xl font-semibold">Available Ministry Tenders</h1>
						<p className="text-sm text-muted-foreground">Review tenders from Monaqasat and promote to opportunities.</p>
					</div>
					<div className="flex gap-2">
						<Button variant="secondary" size="sm" onClick={() => load(pagination.page)} disabled={loading}>
							Refresh
						</Button>
					</div>
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-3">
					<Input
						className="w-[280px]"
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
					<Button variant="secondary" size="sm" onClick={() => load(1)} disabled={loading}>
						Apply Filters
					</Button>
				</div>

				<Card className="mt-4">
					<div className="flex flex-wrap items-end gap-4">
						<div>
							<label className="text-xs font-medium text-muted-foreground">From date (UTC+3, YYYY-MM-DD)</label>
							<input
								type="date"
								className="mt-1 block h-10 w-[180px] rounded border px-3 py-1.5 text-sm"
								value={fromDate}
								onChange={e => setFromDate(e.target.value)}
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-muted-foreground">To date (YYYY-MM-DD)</label>
							<input
								type="date"
								className="mt-1 block h-10 w-[180px] rounded border px-3 py-1.5 text-sm"
								value={toDate}
								onChange={e => setToDate(e.target.value)}
							/>
							</div>
						<Button variant="primary" size="sm" onClick={runCollector} disabled={running}>
							{running ? 'Running...' : 'Run Monaqasat Collector'}
						</Button>
						<Button variant="secondary" size="sm" onClick={() => load(1)} disabled={loading}>
							Filter List
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setFromDate('')
								setToDate('')
								load(1)
							}}
							disabled={loading}
						>
							Clear Filter
						</Button>
						<span className="text-xs text-muted-foreground">Filters apply to publish/close dates.</span>
					</div>
					{runError && <p className="mt-3 text-sm text-destructive">{runError}</p>}
					{runSummary && <p className="mt-3 text-sm text-green-700">{runSummary}</p>}
					{selectedRows.length > 0 && (
						<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
							<Button variant="danger" size="sm" onClick={deleteSelectedTenders} disabled={running}>
								Delete selected ({selectedRows.length})
							</Button>
						</div>
					)}
				</Card>
				{error && <p className="mt-3 text-sm text-destructive">{error}</p>}

				{loading ? (
					<p className="mt-4 text-sm text-muted-foreground">Loading...</p>
				) : rows.length === 0 ? (
					<p className="mt-4 text-sm text-muted-foreground">No tenders found.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-card shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-muted">
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
													className="text-accent hover:underline"
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
											<span className="rounded bg-muted px-2 py-0.5 text-xs">{row.status || 'new'}</span>
										</td>
										<td className="px-3 py-2">
											<span className={`rounded px-2 py-0.5 text-xs ${goNoGo.className}`}>{goNoGo.label}</span>
										</td>
										<td className="px-3 py-2 text-right">
											<div className="flex flex-col items-end gap-2">
												{canReview && (
													<>
														<button
															className="rounded bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
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
															className="rounded bg-destructive px-3 py-1 text-xs text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
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
														className="rounded bg-card px-3 py-1 text-xs text-foreground hover:bg-card"
														onClick={() => nav(`/opportunity/${row.opportunityId}`)}
													>
														Open Opportunity
													</button>
												)}
												<button
													className="rounded bg-green-600 px-3 py-1 text-xs text-primary-foreground hover:bg-green-600/90 disabled:opacity-50"
													onClick={() => promote(row.id)}
													disabled={!canPromote || promoting === row.id || row.status === 'promoted' || hasOpportunity}
												>
													{promoting === row.id ? 'Promoting...' : 'Promote'}
												</button>
												<button
													className="rounded bg-muted px-3 py-1 text-xs hover:bg-muted/80"
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
					<div className="mt-4">
						<PaginationControls
							page={pagination.page}
							pageSize={pagination.pageSize}
							total={pagination.total}
							onPageChange={load}
							disabled={loading}
						/>
					</div>
				)}
			</div>
			{requestTender && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-lg rounded border bg-card p-5 shadow-lg">
						<h2 className="text-lg font-semibold">Request Approval</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Provide a brief rationale before sending this tender for managerial approval.
						</p>
						<div className="mt-4 rounded border bg-muted p-3 text-sm">
							<p className="font-medium">{requestTender.title || requestTender.tenderRef}</p>
							<p className="text-muted-foreground">{requestTender.ministry || 'Unknown ministry'}</p>
						</div>
						<label className="mt-4 block text-xs font-medium text-muted-foreground">Rationale (optional)</label>
						<textarea
							className="mt-1 w-full rounded border p-2 text-sm"
							rows={4}
							value={requestComment}
							onChange={e => setRequestComment(e.target.value)}
							placeholder="Why should we pursue this tender?"
						/>
						<label className="mt-4 block text-xs font-medium text-muted-foreground">Reviewers (Users)</label>
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
						<label className="mt-4 block text-xs font-medium text-muted-foreground">Reviewers (Business Roles)</label>
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
						{requestError && <p className="mt-2 text-sm text-destructive">{requestError}</p>}
						<div className="mt-4 flex items-center justify-end gap-2">
							<button
								className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
								onClick={() => setRequestTender(null)}
								disabled={requestingApproval}
							>
								Cancel
							</button>
							<button
								className="rounded bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
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
					<div className="w-full max-w-lg rounded border bg-card p-5 shadow-lg">
						<h2 className="text-lg font-semibold">Reject Tender</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Provide a short note before rejecting this tender.
						</p>
						<div className="mt-4 rounded border bg-muted p-3 text-sm">
							<p className="font-medium">{rejectTender.title || rejectTender.tenderRef}</p>
							<p className="text-muted-foreground">{rejectTender.ministry || 'Unknown ministry'}</p>
						</div>
						<label className="mt-4 block text-xs font-medium text-muted-foreground">Reason (optional)</label>
						<textarea
							className="mt-1 w-full rounded border p-2 text-sm"
							rows={4}
							value={rejectComment}
							onChange={e => setRejectComment(e.target.value)}
							placeholder="Why are we rejecting this tender?"
						/>
						{rejectError && <p className="mt-2 text-sm text-destructive">{rejectError}</p>}
						<div className="mt-4 flex items-center justify-end gap-2">
							<button
								className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
								onClick={() => setRejectTender(null)}
								disabled={rejectingApproval}
							>
								Cancel
							</button>
							<button
								className="rounded bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
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
					<div className="w-full max-w-lg space-y-3 rounded border bg-card p-5 shadow-lg">
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
						{editError && <p className="text-sm text-destructive">{editError}</p>}
						<div className="flex justify-end gap-2">
							<button
								className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
								onClick={() => setEditingTender(null)}
								disabled={editSaving}
							>
								Cancel
							</button>
							<button
								className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
