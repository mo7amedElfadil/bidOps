import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'
import { SlaBadge } from '../../components/SlaBadge'
import { toast } from '../../utils/toast'
import { USER_TYPE_OPTIONS } from '../../constants/user-types'

const NEW_USER_FORM = {
	name: '',
	email: '',
	role: 'VIEWER',
	userType: 'BID_OWNER',
	team: '',
	password: ''
}

const STAGES = [
	'Sourcing',
	'Qualification',
	'Purchase',
	'Elaboration',
	'Pricing & Approvals',
	'Submission',
	'Evaluation',
	'Outcome',
	'Closeout'
]

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

	const [isEditing, setIsEditing] = useState(false)
	const [form, setForm] = useState({
		title: '',
		clientInput: '',
		stage: '',
		status: '',
		priorityRank: '',
		tenderRef: '',
		submissionDate: '',
		modeOfSubmission: '',
		sourcePortal: '',
		description: '',
		dataOwner: '',
		ownerId: '',
		bidOwnerIds: [] as string[]
	})
	const [showAddUserModal, setShowAddUserModal] = useState(false)
	const [newUserForm, setNewUserForm] = useState(NEW_USER_FORM)
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

	const stageIndex = useMemo(() => STAGES.findIndex(s => s === (data?.stage || '')), [data?.stage])

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
	const resolveIssue = useMutation({
		mutationFn: (issueId: string) => api.resolveImportIssue(issueId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['import-issues', id] })
		}
	})

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
					<div className="rounded border bg-slate-50 p-4 text-sm">
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
											{STAGES.map(stage => (
												<option key={stage} value={stage}>
													{stage}
												</option>
											))}
										</select>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Status
										<input
											className="rounded border px-2 py-1 text-sm"
											value={form.status}
											onChange={e => setForm({ ...form, status: e.target.value })}
											placeholder="Open / Submitted / Won..."
										/>
									</label>
									<label className="grid gap-1 text-xs font-medium">
										Priority
										<input
											type="number"
											className="rounded border px-2 py-1 text-sm"
											value={form.priorityRank}
											onChange={e => setForm({ ...form, priorityRank: e.target.value })}
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
								Invalid values were left empty. Update the fields to clear them from this list.
							</p>
							<ul className="mt-2 space-y-2">
								{issuesQuery.data?.map(issue => (
									<li key={issue.id} className="rounded border border-amber-200 bg-white p-2">
										<div className="flex items-center justify-between gap-2">
											<div>
												<p className="font-medium">
													Row {issue.rowIndex} • {issue.columnName || issue.fieldName}
												</p>
												<p className="text-amber-800">
													{issue.message} {issue.rawValue ? `(${issue.rawValue})` : ''}
												</p>
											</div>
											<button
												className="rounded border px-2 py-1 text-[11px] hover:bg-amber-100"
												onClick={() => resolveIssue.mutate(issue.id)}
												disabled={resolveIssue.isPending}
											>
												Mark resolved
											</button>
										</div>
									</li>
								))}
							</ul>
						</div>
					)}
					<div className="rounded border bg-white p-3 text-xs text-slate-600">
						<p>Stage progression</p>
						<div className="mt-2 flex flex-wrap gap-2">
							{STAGES.map((stage, index) => (
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
