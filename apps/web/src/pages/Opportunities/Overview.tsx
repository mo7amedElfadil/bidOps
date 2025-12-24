import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, OpportunityChecklist, ChangeRequest, ImportIssue } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'
import { SlaBadge } from '../../components/SlaBadge'
import { toast } from '../../utils/toast'
import { USER_TYPE_OPTIONS } from '../../constants/user-types'
import { DEFAULT_STAGE_LIST, DEFAULT_STATUS_LIST } from '../../constants/opportunity-lists'

const NEW_USER_FORM = {
	name: '',
	email: '',
	role: 'VIEWER',
	userType: 'BID_OWNER',
	team: '',
	password: ''
}

function toIsoWithOffset(value: string, offsetHours: number) {
	const [datePart, timePart = '00:00'] = value.split('T')
	const [year, month, day] = datePart.split('-').map(Number)
	const [hour, minute] = timePart.split(':').map(Number)
	const utc = Date.UTC(year, month - 1, day, hour - offsetHours, minute)
	return new Date(utc).toISOString()
}

function toLocalInput(value: string, offsetHours: number) {
	const date = new Date(value)
	const shifted = new Date(date.getTime() + offsetHours * 60 * 60 * 1000)
	const yyyy = shifted.getUTCFullYear()
	const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
	const dd = String(shifted.getUTCDate()).padStart(2, '0')
	const hh = String(shifted.getUTCHours()).padStart(2, '0')
	const min = String(shifted.getUTCMinutes()).padStart(2, '0')
	return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export default function OpportunityOverview() {
	const { id } = useParams<{ id: string }>()
	const qc = useQueryClient()
	const { data, isLoading } = useQuery({
		queryKey: ['opportunity', id],
		enabled: Boolean(id),
		queryFn: () => api.getOpportunity(id || '')
	})
	const issuesQuery = useQuery({
		queryKey: ['import-issues', id],
		enabled: Boolean(id),
		queryFn: () => api.listImportIssues({ opportunityId: id, resolved: false })
	})
	const clients = useQuery({
		queryKey: ['clients'],
		queryFn: () => api.listClients({ page: 1, pageSize: 500 })
	})
	const usersQuery = useQuery({
		queryKey: ['users', 'owners'],
		queryFn: () => api.listUsers({ page: 1, pageSize: 500 })
	})
	const timezoneQuery = useQuery({ queryKey: ['timezone'], queryFn: api.getTimezoneSettings })
	const stageListQuery = useQuery({
		queryKey: ['opportunity-stages'],
		queryFn: api.getOpportunityStages
	})
	const statusListQuery = useQuery({
		queryKey: ['opportunity-statuses'],
		queryFn: api.getOpportunityStatuses
	})
	const checklistQuery = useQuery({
		queryKey: ['opportunity-checklist', id],
		enabled: Boolean(id),
		queryFn: () => api.getOpportunityChecklist(id || '')
	})

	const [isEditing, setIsEditing] = useState(false)
	const [form, setForm] = useState({
		title: '',
		clientInput: '',
		stage: '',
		status: '',
		priorityRank: '',
		validityDays: '',
		tenderRef: '',
		submissionDate: '',
		modeOfSubmission: '',
		sourcePortal: '',
		description: '',
		dataOwner: '',
		ownerId: '',
		bidOwnerIds: [] as string[]
	})
	const summaryRef = useRef<HTMLDivElement>(null)
	const submissionDateRef = useRef<HTMLInputElement>(null)
	const priorityRankRef = useRef<HTMLInputElement>(null)
	const validityDaysRef = useRef<HTMLInputElement>(null)
	const ownerIdRef = useRef<HTMLSelectElement>(null)
	const dataOwnerRef = useRef<HTMLInputElement>(null)
	const bidOwnersRef = useRef<HTMLSelectElement>(null)
	const fieldRefs = useMemo(
		() => ({
			submissionDate: submissionDateRef,
			priorityRank: priorityRankRef,
			validityDays: validityDaysRef,
			ownerId: ownerIdRef,
			dataOwner: dataOwnerRef,
			bidOwnerIds: bidOwnersRef
		}),
		[]
	)
	type FocusField = keyof typeof fieldRefs
	const [focusField, setFocusField] = useState<FocusField | null>(null)
	const stageOptions = stageListQuery.data?.stages ?? DEFAULT_STAGE_LIST
	const statusOptions = statusListQuery.data?.statuses ?? DEFAULT_STATUS_LIST
	const [showAddUserModal, setShowAddUserModal] = useState(false)
	const [newUserForm, setNewUserForm] = useState(NEW_USER_FORM)
	const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({})
	const [changeRequestForm, setChangeRequestForm] = useState({
		changes: '',
		impact: ''
	})
	const createUserMutation = useMutation({
		mutationFn: () =>
			api.createUser({
				email: newUserForm.email,
				name: newUserForm.name || undefined,
				role: newUserForm.role as any,
				userType: newUserForm.userType,
				team: newUserForm.team || undefined,
				password: newUserForm.password || undefined
			}),
		onSuccess: user => {
			toast.success('User created')
			usersQuery.refetch()
			setNewUserForm(NEW_USER_FORM)
			setShowAddUserModal(false)
			setForm(prev => ({
				...prev,
				bidOwnerIds: Array.from(new Set([...prev.bidOwnerIds, user.id])),
				ownerId: prev.ownerId || user.id
			}))
		},
		onError: err => {
			toast.error((err as Error).message || 'Failed to create user')
		}
	})

	useEffect(() => {
		if (!data) return
		const offsetHours = timezoneQuery.data?.offsetHours ?? 3
		setForm({
			title: data.title || '',
			clientInput: data.clientName || data.clientId || '',
			stage: data.stage || '',
			status: data.status || '',
			priorityRank: data.priorityRank?.toString() || '',
			validityDays: data.validityDays?.toString() || '',
			tenderRef: (data as any).tenderRef || '',
			submissionDate: data.submissionDate ? toLocalInput(data.submissionDate, offsetHours) : '',
			modeOfSubmission: data.modeOfSubmission || '',
			sourcePortal: data.sourcePortal || '',
			description: (data as any).description || '',
			dataOwner: (data as any).dataOwner || '',
			ownerId: (data as any).ownerId || '',
			bidOwnerIds: data.bidOwners?.map(owner => owner.id) || []
		})
	}, [data, timezoneQuery.data])

	useEffect(() => {
		if (!isEditing || !focusField) return
		const ref = fieldRefs[focusField]?.current
		if (ref) {
			ref.focus()
			ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
		}
		setFocusField(null)
	}, [focusField, isEditing, fieldRefs])

	const stageIndex = useMemo(() => stageOptions.findIndex(s => s === (data?.stage || '')), [
		stageOptions,
		data?.stage
	])

	const updateMutation = useMutation({
		mutationFn: () => {
			const name = form.clientInput.trim()
			const match = clients.data?.items?.find(c => c.name.toLowerCase() === name.toLowerCase())
			const offsetHours = timezoneQuery.data?.offsetHours ?? 3
			const submissionDate = form.submissionDate
				? toIsoWithOffset(form.submissionDate, offsetHours)
				: undefined
			const ownerName = form.ownerId
				? usersQuery.data?.items?.find(user => user.id === form.ownerId)?.name
				: undefined
			const dataOwner = form.dataOwner || ownerName || undefined
			return api.updateOpportunity(id || '', {
				title: form.title || undefined,
				clientId: match?.id,
				clientName: match ? undefined : name || undefined,
				stage: form.stage || undefined,
				status: form.status || undefined,
				priorityRank: form.priorityRank ? Number(form.priorityRank) : undefined,
				validityDays: form.validityDays ? Number(form.validityDays) : undefined,
				tenderRef: form.tenderRef || undefined,
				submissionDate,
				modeOfSubmission: form.modeOfSubmission || undefined,
				sourcePortal: form.sourcePortal || undefined,
				description: form.description || undefined,
				dataOwner,
				ownerId: form.ownerId || undefined
			} as any).then(updated =>
				api
					.setBidOwners(id || '', form.bidOwnerIds || [])
					.then(() => updated)
			)
		},
		onSuccess: () => {
			setIsEditing(false)
			qc.invalidateQueries({ queryKey: ['opportunity', id] })
			qc.invalidateQueries({ queryKey: ['opportunities'] })
			qc.invalidateQueries({ queryKey: ['import-issues', id] })
		}
	})
	const updateChecklistMutation = useMutation({
		mutationFn: (payload: Parameters<typeof api.updateOpportunityChecklist>[1]) =>
			api.updateOpportunityChecklist(id || '', payload),
		onSuccess: data => {
			qc.setQueryData(['opportunity-checklist', id], data)
		},
		onError: err => {
			toast.error((err as Error).message || 'Failed to update checklist')
		}
	})
	const changeRequestsQuery = useQuery({
		queryKey: ['change-requests', id],
		enabled: Boolean(id),
		queryFn: () => api.listChangeRequests({ opportunityId: id })
	})
	const createChangeRequestMutation = useMutation({
		mutationFn: () =>
			api.createChangeRequest({
				opportunityId: id || '',
				changes: changeRequestForm.changes.trim(),
				impact: changeRequestForm.impact.trim() || undefined
			}),
		onSuccess: () => {
			toast.success('Change request submitted')
			setChangeRequestForm({ changes: '', impact: '' })
			changeRequestsQuery.refetch()
		},
		onError: err => {
			toast.error((err as Error).message || 'Failed to submit change request')
		}
	})
	const updateChangeRequestMutation = useMutation({
		mutationFn: (input: { id: string; status: ChangeRequest['status'] }) =>
			api.updateChangeRequest(input.id, { status: input.status }),
		onSuccess: () => {
			changeRequestsQuery.refetch()
		},
		onError: err => {
			toast.error((err as Error).message || 'Failed to update change request')
		}
	})

	useEffect(() => {
		if (!checklistQuery.data) return
		const notes = checklistQuery.data.notes || {}
		setChecklistNotes({
			bondPurchased: notes.bondPurchased || '',
			formsCompleted: notes.formsCompleted || '',
			finalPdfReady: notes.finalPdfReady || '',
			complianceCreated: notes.complianceCreated || '',
			clarificationsSent: notes.clarificationsSent || '',
			pricingApproved: notes.pricingApproved || ''
		})
	}, [checklistQuery.data])

	const showBondReminder =
		!isLoading &&
		data?.daysLeft !== undefined &&
		data?.daysLeft !== null &&
		data?.daysLeft <= 7 &&
		data?.daysLeft >= 0 &&
		(checklistQuery.data ? !checklistQuery.data.bondPurchased : true)

	const checklistItems: Array<{
		key: keyof OpportunityChecklist
		label: string
		help: string
	}> = [
		{ key: 'bondPurchased', label: 'Tender bond submitted', help: 'Upload receipt or mark complete.' },
		{ key: 'formsCompleted', label: 'Mandatory forms completed', help: 'Confirm all required forms are done.' },
		{ key: 'finalPdfReady', label: 'Final combined PDF ready', help: 'Technical + commercial merged.' },
		{ key: 'complianceCreated', label: 'Compliance created', help: 'Ensure the compliance matrix is documented.' },
		{ key: 'clarificationsSent', label: 'Clarifications sent (or N/A)', help: 'Tick once clarifications have been issued or are not required.' },
		{
			key: 'pricingApproved',
			label: 'Pricing approved',
			help: 'Auto-checks after pricing approvals finish; you can toggle manually if needed.'
		}
	]
	const issueFixTargets: Record<string, { label: string; field: FocusField; hint?: string }> = {
		submissionDate: { label: 'Submission Date/Time', field: 'submissionDate' },
		daysLeft: {
			label: 'Submission Date/Time',
			field: 'submissionDate',
			hint: 'Days left is derived from the submission date.'
		},
		priorityRank: { label: 'Priority', field: 'priorityRank' },
		validityDays: { label: 'Validity (days)', field: 'validityDays' },
		ownerId: { label: 'Business Owner (User)', field: 'ownerId' },
		dataOwner: { label: 'Business Owner', field: 'dataOwner' },
		bidOwners: { label: 'Bid Owners', field: 'bidOwnerIds' }
	}

	const handleFixIssue = (issue: ImportIssue) => {
		const target = issueFixTargets[issue.fieldName]
		setIsEditing(true)
		summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		if (target) {
			setFocusField(target.field)
		} else {
			toast.info('This field is not editable here yet. Update the original tracker CSV and re-import if needed.')
		}
	}

	return (
		<OpportunityShell active="overview">
			<div className="grid gap-6 p-6 md:grid-cols-2">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Summary</h2>
						<button
							className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
							onClick={() => setIsEditing(v => !v)}
							disabled={!data}
						>
							{isEditing ? 'Cancel' : 'Edit'}
						</button>
					</div>
					<div ref={summaryRef} className="rounded border bg-slate-50 p-4 text-sm">
						{isEditing ? (
							<div className="grid gap-3">
								<label className="grid gap-1 text-xs font-medium">
									Title
									<input
										className="rounded border px-2 py-1 text-sm"
										value={form.title}
										onChange={e => setForm({ ...form, title: e.target.value })}
									/>
								</label>
								<label className="grid gap-1 text-xs font-medium">
									Client
									<input
										className="rounded border px-2 py-1 text-sm"
										value={form.clientInput}
										onChange={e => setForm({ ...form, clientInput: e.target.value })}
										list="overview-client-list"
									/>
								</label>
								<datalist id="overview-client-list">
									{clients.data?.items?.map(c => (
										<option key={c.id} value={c.name} />
									))}
								</datalist>
								<div className="grid gap-3 md:grid-cols-2">
									<label className="grid gap-1 text-xs font-medium">
										Stage
										<select
											className="rounded border px-2 py-1 text-sm"
											value={form.stage}
											onChange={e => setForm({ ...form, stage: e.target.value })}
										>
											<option value="">—</option>
											{stageOptions.map(stage => (
												<option key={stage} value={stage}>
													{stage}
												</option>
											))}
										</select>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Status
										<select
											className="rounded border px-2 py-1 text-sm"
											value={form.status}
											onChange={e => setForm({ ...form, status: e.target.value })}
										>
											<option value="">—</option>
											{statusOptions.map(status => (
												<option key={status} value={status}>
													{status}
												</option>
											))}
										</select>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Priority
										<input
											type="number"
											className="rounded border px-2 py-1 text-sm"
											value={form.priorityRank}
											onChange={e => setForm({ ...form, priorityRank: e.target.value })}
											ref={priorityRankRef}
										/>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Validity (days)
										<input
											type="number"
											className="rounded border px-2 py-1 text-sm"
											value={form.validityDays}
											onChange={e => setForm({ ...form, validityDays: e.target.value })}
											ref={validityDaysRef}
										/>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Tender Ref
										<input
											className="rounded border px-2 py-1 text-sm"
											value={form.tenderRef}
											onChange={e => setForm({ ...form, tenderRef: e.target.value })}
										/>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Submission Date/Time
										<input
											type="datetime-local"
											className="rounded border px-2 py-1 text-sm"
											value={form.submissionDate}
											onChange={e => setForm({ ...form, submissionDate: e.target.value })}
											ref={submissionDateRef}
										/>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Mode of Submission
										<input
											className="rounded border px-2 py-1 text-sm"
											value={form.modeOfSubmission}
											onChange={e => setForm({ ...form, modeOfSubmission: e.target.value })}
										/>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Source Portal
										<input
											className="rounded border px-2 py-1 text-sm"
											value={form.sourcePortal}
											onChange={e => setForm({ ...form, sourcePortal: e.target.value })}
										/>
									</label>
								</div>
								<label className="grid gap-1 text-xs font-medium">
									Description
									<textarea
										className="min-h-[70px] rounded border px-2 py-1 text-sm"
										value={form.description}
										onChange={e => setForm({ ...form, description: e.target.value })}
									/>
								</label>
								<label className="grid gap-1 text-xs font-medium">
									Business Owner (User)
									<select
										className="rounded border px-2 py-1 text-sm"
										value={form.ownerId}
										onChange={e => setForm({ ...form, ownerId: e.target.value })}
										ref={ownerIdRef}
									>
										<option value="">—</option>
										{usersQuery.data?.items?.map(user => (
											<option key={user.id} value={user.id}>
												{user.name || user.email} {user.isActive ? '' : '(inactive)'}
											</option>
										))}
									</select>
								</label>
								<label className="grid gap-1 text-xs font-medium">
									Business Owner
									<input
										className="rounded border px-2 py-1 text-sm"
										value={form.dataOwner}
										onChange={e => setForm({ ...form, dataOwner: e.target.value })}
										ref={dataOwnerRef}
									/>
								</label>
								<label className="grid gap-1 text-xs font-medium">
									<div className="flex items-center justify-between">
										<span>Bid Owners</span>
										<button
											type="button"
											className="rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600 hover:border-blue-600 hover:text-blue-700"
											onClick={() => setShowAddUserModal(true)}
										>
											Add user
										</button>
									</div>
									<select
										multiple
										className="min-h-[100px] rounded border px-2 py-1 text-sm"
										value={form.bidOwnerIds}
										onChange={e =>
											setForm({
												...form,
												bidOwnerIds: Array.from(e.target.selectedOptions).map(opt => opt.value)
											})
										}
										ref={bidOwnersRef}
									>
										{usersQuery.data?.items?.map(user => (
											<option key={user.id} value={user.id}>
												{user.name || user.email} {user.isActive ? '' : '(inactive)'}
											</option>
										))}
									</select>
								</label>
								<div className="flex items-center gap-2">
									<button
										className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white"
										onClick={() => updateMutation.mutate()}
										disabled={updateMutation.isPending}
									>
										{updateMutation.isPending ? 'Saving...' : 'Save'}
									</button>
									{updateMutation.error && (
										<span className="text-xs text-red-600">
											{(updateMutation.error as Error).message}
										</span>
									)}
								</div>
							</div>
						) : (
							<div className="space-y-1">
								<p><span className="font-medium">Client:</span> {data?.clientName || data?.clientId || '—'}</p>
								<p><span className="font-medium">Stage:</span> {data?.stage || '—'}</p>
								<p><span className="font-medium">Status:</span> {data?.status || '—'}</p>
								<p><span className="font-medium">Priority:</span> {data?.priorityRank ?? '—'}</p>
								<p><span className="font-medium">Validity (days):</span> {data?.validityDays ?? '—'}</p>
								<p><span className="font-medium">Tender Ref:</span> {(data as any)?.tenderRef || '—'}</p>
								<p>
									<span className="font-medium">Business Owner:</span>{' '}
									{(data as any)?.dataOwner ||
										usersQuery.data?.items?.find(user => user.id === (data as any)?.ownerId)?.name ||
										'—'}
								</p>
								<p>
									<span className="font-medium">Bid Owners:</span>{' '}
									{data?.bidOwners?.length
										? data.bidOwners.map(owner => owner.name || owner.email || owner.id).join(', ')
										: '—'}
								</p>
								<p className="flex items-center gap-2">
									<span className="font-medium">Submission:</span>
									{data?.submissionDate ? data.submissionDate.slice(0, 10) : '—'}
									<SlaBadge daysLeft={data?.daysLeft} />
								</p>
								<p><span className="font-medium">Mode:</span> {data?.modeOfSubmission || '—'}</p>
								<p><span className="font-medium">Source:</span> {data?.sourcePortal || '—'}</p>
								<p><span className="font-medium">Description:</span> {(data as any)?.description || '—'}</p>
							</div>
						)}
					</div>
					{(issuesQuery.data?.length ?? 0) > 0 && (
						<div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
							<p className="font-medium">Import issues</p>
							<p className="mt-1 text-amber-800">
								These came from the tracker CSV. Fix the field in Summary (Edit) to clear the warning.
							</p>
							<ul className="mt-2 space-y-2">
								{issuesQuery.data?.map(issue => {
									const fixTarget = issueFixTargets[issue.fieldName]
									return (
										<li key={issue.id} className="rounded border border-amber-200 bg-white p-2">
											<div className="flex items-center justify-between gap-2">
												<div>
													<p className="font-medium">
														Tracker row {issue.rowIndex} • {issue.columnName || issue.fieldName}
													</p>
													<p className="text-amber-800">
														{issue.message} {issue.rawValue ? `(${issue.rawValue})` : ''}
													</p>
													{fixTarget ? (
															<p className="text-amber-700">
																Fix in Summary {'>'} {fixTarget.label}
																{fixTarget.hint ? ` (${fixTarget.hint})` : ''}
															</p>
													) : (
														<p className="text-amber-700">Fix in Summary (Edit) or re-import after correction.</p>
													)}
												</div>
												<button
													className="rounded border px-2 py-1 text-[11px] hover:bg-amber-100"
													onClick={() => handleFixIssue(issue)}
												>
													Fix
												</button>
											</div>
										</li>
									)
								})}
							</ul>
						</div>
					)}
					<div className="rounded border bg-white p-3 text-xs text-slate-600">
						<p>Stage progression</p>
						<div className="mt-2 flex flex-wrap gap-2">
							{stageOptions.map((stage, index) => (
								<span
									key={stage}
									className={`rounded-full px-2 py-0.5 ${
										stageIndex === index
											? 'bg-blue-600 text-white'
											: stageIndex > index
												? 'bg-emerald-100 text-emerald-800'
												: 'bg-slate-100 text-slate-600'
									}`}
								>
									{stage}
								</span>
							))}
						</div>
					</div>
				</div>
				<div className="space-y-3">
					{showBondReminder && (
						<div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
							<p className="font-medium">Tender bond reminder</p>
							<p className="mt-1 text-amber-800">
								The submission deadline is within 7 days. Please purchase and upload the tender bond receipt.
							</p>
						</div>
					)}
					<div className="rounded border bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Submission Checklist</h2>
							{checklistQuery.isLoading && <span className="text-xs text-slate-500">Loading…</span>}
						</div>
						<div className="mt-3 space-y-3 text-sm">
							{checklistItems.map(item => {
								const checked = Boolean((checklistQuery.data as any)?.[item.key])
								return (
									<div key={item.key} className="rounded border border-slate-200 p-3">
										<label className="flex items-start justify-between gap-2">
											<div>
												<p className="font-medium">{item.label}</p>
												<p className="text-xs text-slate-500">{item.help}</p>
											</div>
											<input
												type="checkbox"
												checked={checked}
												onChange={e =>
													updateChecklistMutation.mutate({
														[item.key]: { done: e.target.checked }
													} as any)
												}
											/>
										</label>
										<div className="mt-2 flex items-center gap-2">
											<input
												className="w-full rounded border px-2 py-1 text-xs"
												placeholder="Notes (optional)"
												value={checklistNotes[item.key as string] || ''}
												onChange={e =>
													setChecklistNotes(prev => ({
														...prev,
														[item.key as string]: e.target.value
													}))
												}
											/>
											<button
												className="rounded border px-2 py-1 text-[11px] hover:bg-slate-50"
												onClick={() =>
													updateChecklistMutation.mutate({
														[item.key]: { notes: checklistNotes[item.key as string] }
													} as any)
												}
											>
												Save
											</button>
										</div>
									</div>
								)
							})}
						</div>
					</div>
					<div className="rounded border bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Change Requests</h2>
							{changeRequestsQuery.isLoading && <span className="text-xs text-slate-500">Loading…</span>}
						</div>
						<div className="mt-3 space-y-3 text-sm">
							<div className="rounded border border-slate-200 p-3">
								<label className="block text-xs font-medium text-slate-600">Changes required</label>
								<textarea
									className="mt-1 w-full rounded border p-2 text-sm"
									rows={3}
									placeholder="Describe the change needed after approvals are locked."
									value={changeRequestForm.changes}
									onChange={e => setChangeRequestForm({ ...changeRequestForm, changes: e.target.value })}
								/>
								<label className="mt-3 block text-xs font-medium text-slate-600">Impact (optional)</label>
								<input
									className="mt-1 w-full rounded border px-2 py-1 text-sm"
									placeholder="Cost, schedule, compliance impact"
									value={changeRequestForm.impact}
									onChange={e => setChangeRequestForm({ ...changeRequestForm, impact: e.target.value })}
								/>
								<div className="mt-3 flex justify-end">
									<button
										className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
										onClick={() => createChangeRequestMutation.mutate()}
										disabled={createChangeRequestMutation.isPending || !changeRequestForm.changes.trim()}
									>
										{createChangeRequestMutation.isPending ? 'Submitting...' : 'Submit change request'}
									</button>
								</div>
							</div>
							{changeRequestsQuery.data?.length ? (
								<div className="space-y-2">
									{changeRequestsQuery.data.map(req => (
										<div key={req.id} className="rounded border border-slate-200 p-3">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div>
													<p className="font-medium">{req.changes}</p>
													{req.impact && <p className="text-xs text-slate-500">Impact: {req.impact}</p>}
												</div>
												<select
													className="rounded border px-2 py-1 text-xs"
													value={req.status}
													onChange={e =>
														updateChangeRequestMutation.mutate({
															id: req.id,
															status: e.target.value as ChangeRequest['status']
														})
													}
													disabled={updateChangeRequestMutation.isPending}
												>
													<option value="PENDING">Pending</option>
													<option value="IN_REVIEW">In review</option>
													<option value="APPROVED">Approved</option>
													<option value="REJECTED">Rejected</option>
												</select>
											</div>
											<p className="mt-2 text-xs text-slate-400">
												Created {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-xs text-slate-500">No change requests yet.</p>
							)}
						</div>
					</div>
					<h2 className="text-lg font-semibold">Quick Links</h2>
					<div className="grid gap-2 sm:grid-cols-2">
						{[
							{ href: `/opportunity/${id}/attachments`, label: 'Attachments' },
							{ href: `/opportunity/${id}/compliance`, label: 'Compliance Matrix' },
							{ href: `/opportunity/${id}/clarifications`, label: 'Clarifications' },
							{ href: `/opportunity/${id}/pricing`, label: 'Pricing Workspace' },
							{ href: `/opportunity/${id}/approvals`, label: 'Approvals' },
							{ href: `/opportunity/${id}/submission`, label: 'Submission Pack' },
							{ href: `/opportunity/${id}/outcome`, label: 'Outcome' }
						].map(link => (
							<Link
								key={link.href}
								to={link.href}
								className="rounded border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:border-blue-300 hover:text-blue-700"
							>
								{link.label}
							</Link>
						))}
					</div>
					{isLoading && <p className="text-sm text-slate-600">Loading quick stats...</p>}
					<div className="rounded border bg-white p-3 text-xs text-slate-600">
						<p>Use this overview to confirm key dates and jump into detailed workspaces.</p>
					</div>
				</div>
			</div>
			{showAddUserModal && (
				<div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-md rounded border bg-white p-5 shadow-lg">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">New user</h2>
							<button
								className="text-xs text-slate-500 hover:text-slate-700"
								onClick={() => setShowAddUserModal(false)}
							>
								Close
							</button>
						</div>
						<div className="mt-3 grid gap-3">
							<label className="text-sm">
								<span className="font-medium">Full name</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2 text-sm"
									value={newUserForm.name}
									onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Email</span>
								<input
									type="email"
									className="mt-1 w-full rounded border px-3 py-2 text-sm"
									value={newUserForm.email}
									onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
								/>
							</label>
							<div className="grid gap-3 md:grid-cols-2">
								<label className="text-sm">
									<span className="font-medium">Role</span>
									<select
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										value={newUserForm.role}
										onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
									>
										<option value="ADMIN">ADMIN</option>
										<option value="MANAGER">MANAGER</option>
										<option value="CONTRIBUTOR">CONTRIBUTOR</option>
										<option value="VIEWER">VIEWER</option>
									</select>
								</label>
								<label className="text-sm">
									<span className="font-medium">User type</span>
									<select
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										value={newUserForm.userType}
										onChange={e => setNewUserForm({ ...newUserForm, userType: e.target.value })}
									>
										{USER_TYPE_OPTIONS.map(type => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</select>
								</label>
							</div>
							<label className="text-sm">
								<span className="font-medium">Team (optional)</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2 text-sm"
									value={newUserForm.team}
									onChange={e => setNewUserForm({ ...newUserForm, team: e.target.value })}
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Password (optional)</span>
								<input
									type="password"
									className="mt-1 w-full rounded border px-3 py-2 text-sm"
									value={newUserForm.password}
									onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
								/>
							</label>
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
								onClick={() => setShowAddUserModal(false)}
								disabled={createUserMutation.isPending}
							>
								Cancel
							</button>
							<button
								className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
								onClick={() => createUserMutation.mutate()}
								disabled={!newUserForm.email || !newUserForm.name || createUserMutation.isPending}
							>
								{createUserMutation.isPending ? 'Creating...' : 'Create user'}
							</button>
						</div>
					</div>
				</div>
			)}
		</OpportunityShell>
	)
}
