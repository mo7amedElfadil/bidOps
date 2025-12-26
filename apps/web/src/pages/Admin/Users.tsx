import { useEffect, useState } from 'react'
import { api, BusinessRole, UserAccount } from '../../api/client'
import { USER_TYPE_OPTIONS, getUserTypeLabel } from '../../constants/user-types'
import PaginationControls from '../../components/PaginationControls'

export default function UsersPage() {
	const [rows, setRows] = useState<UserAccount[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 })
	const [filter, setFilter] = useState({ q: '' })
	const [editing, setEditing] = useState<UserAccount | null>(null)
	const [businessRoles, setBusinessRoles] = useState<BusinessRole[]>([])
	const [editForm, setEditForm] = useState({
		email: '',
		name: '',
		role: 'VIEWER',
		team: '',
		isActive: true,
		status: 'ACTIVE',
		mustChangePassword: false,
		password: '',
		userType: 'INTERNAL',
		businessRoleIds: [] as string[]
	})
	const [inviteMode, setInviteMode] = useState(true)
	const [saving, setSaving] = useState(false)
	const [showCreate, setShowCreate] = useState(false)
	const [selected, setSelected] = useState<Record<string, boolean>>({})
	const [bulkDeleting, setBulkDeleting] = useState(false)
	const statusLabel = (user: UserAccount) => {
		const status = user.status || (user.isActive ? 'ACTIVE' : 'DISABLED')
		switch (status) {
			case 'ACTIVE':
				return { label: 'active', className: 'bg-emerald-100 text-emerald-800' }
			case 'INVITED':
				return { label: 'invited', className: 'bg-blue-100 text-blue-800' }
			case 'PENDING':
				return { label: 'pending', className: 'bg-amber-100 text-amber-800' }
			default:
				return { label: 'disabled', className: 'bg-slate-100 text-slate-600' }
		}
	}

	const toggleAll = (checked: boolean) => {
		const map: Record<string, boolean> = {}
		rows.forEach(user => {
			map[user.id] = checked
		})
		setSelected(map)
	}

	const allSelected = rows.length > 0 && rows.every(user => selected[user.id])

	async function load(pageOverride?: number) {
		setLoading(true)
		setError(null)
		try {
			const data = await api.listUsers({
				page: pageOverride || pagination.page,
				pageSize: pagination.pageSize,
				q: filter.q || undefined
			})
			setRows(data.items)
			setPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
			setSelected({})
			const roles = await api.listBusinessRoles()
			setBusinessRoles(roles)
		} catch (e: any) {
			setError(e.message || 'Failed to load users')
		}
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	function openEdit(user: UserAccount) {
		setEditing(user)
		setEditForm({
			email: user.email,
			name: user.name,
			role: user.role,
			team: user.team || '',
			isActive: user.isActive,
			status: user.status || (user.isActive ? 'ACTIVE' : 'DISABLED'),
			mustChangePassword: user.mustChangePassword || false,
			password: '',
			userType: user.userType || 'INTERNAL',
			businessRoleIds: user.businessRoles?.map(role => role.id) || []
		})
		setInviteMode(false)
	}

	async function saveEdit() {
		if (!editing) return
		setSaving(true)
		setError(null)
		try {
			await api.updateUser(editing.id, {
				email: editForm.email || undefined,
				name: editForm.name || undefined,
				role: editForm.role as any,
				team: editForm.team || undefined,
				isActive: editForm.isActive,
				status: editForm.status as any,
				mustChangePassword: editForm.mustChangePassword,
				password: editForm.password || undefined,
				userType: editForm.userType || undefined,
				businessRoleIds: editForm.businessRoleIds
			})
			await load(pagination.page)
			setEditing(null)
		} catch (e: any) {
			setError(e.message || 'Failed to update user')
		}
		setSaving(false)
	}

	async function createUser() {
		setSaving(true)
		setError(null)
		try {
			if (inviteMode) {
				await api.inviteUser({
					email: editForm.email,
					name: editForm.name || undefined,
					role: editForm.role as any,
					userType: editForm.userType || undefined,
					businessRoleIds: editForm.businessRoleIds
				})
			} else {
				await api.createUser({
					email: editForm.email || undefined,
					name: editForm.name || undefined,
					role: editForm.role as any,
					team: editForm.team || undefined,
					isActive: editForm.isActive,
					status: editForm.status as any,
					mustChangePassword: editForm.mustChangePassword,
					password: editForm.password || undefined,
					userType: editForm.userType || undefined,
					businessRoleIds: editForm.businessRoleIds
				})
			}
			setShowCreate(false)
			setEditForm({
				email: '',
				name: '',
				role: 'VIEWER',
				team: '',
				isActive: true,
				status: 'ACTIVE',
				mustChangePassword: false,
				password: '',
				userType: 'INTERNAL',
				businessRoleIds: []
			})
			setInviteMode(true)
			await load(1)
		} catch (e: any) {
			setError(e.message || 'Failed to create user')
		}
		setSaving(false)
	}

	async function removeUser(id: string) {
		if (!confirm('Delete this user? This cannot be undone.')) return
		setError(null)
		try {
			await api.deleteUser(id)
			await load(pagination.page)
		} catch (e: any) {
			setError(e.message || 'Failed to delete user')
		}
	}

	async function approveUser(user: UserAccount) {
		setError(null)
		try {
			await api.updateUser(user.id, { status: 'ACTIVE', isActive: true })
			await load(pagination.page)
		} catch (e: any) {
			setError(e.message || 'Failed to approve user')
		}
	}

	async function resendInvite(user: UserAccount) {
		setError(null)
		try {
			await api.inviteUser({
				email: user.email,
				name: user.name,
				role: user.role,
				userType: user.userType,
				businessRoleIds: user.businessRoles?.map(role => role.id)
			})
		} catch (e: any) {
			setError(e.message || 'Failed to resend invite')
		}
	}

	async function resetPassword(user: UserAccount) {
		setError(null)
		try {
			await api.forgotPassword({ email: user.email })
		} catch (e: any) {
			setError(e.message || 'Failed to send reset')
		}
	}

	async function removeSelectedUsers() {
		const ids = Object.entries(selected)
			.filter(([, checked]) => checked)
			.map(([id]) => id)
		if (!ids.length) return
		if (!confirm(`Delete ${ids.length} selected user(s)? This cannot be undone.`)) return
		setBulkDeleting(true)
		setError(null)
		try {
			await api.deleteUsers(ids)
			await load(pagination.page)
		} catch (e: any) {
			setError(e.message || 'Failed to delete users')
		} finally {
			setBulkDeleting(false)
		}
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="w-full px-6 py-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-semibold">User Management</h1>
						<p className="text-sm text-slate-600">Create, edit roles, and disable accounts.</p>
					</div>
					<div className="flex gap-2 items-center">
						<button
							className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
							onClick={() => load(pagination.page)}
							disabled={loading}
						>
							Refresh
						</button>
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={() => {
								setEditForm({
									email: '',
									name: '',
									role: 'VIEWER',
									team: '',
									isActive: true,
									status: 'ACTIVE',
									mustChangePassword: false,
									password: '',
									userType: 'INTERNAL',
									businessRoleIds: []
								})
								setInviteMode(true)
								setShowCreate(true)
							}}
						>
							New User
						</button>
						<button
							className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
							onClick={removeSelectedUsers}
							disabled={bulkDeleting || !Object.values(selected).some(Boolean)}
						>
							{bulkDeleting ? 'Deleting…' : `Delete selected (${Object.values(selected).filter(Boolean).length})`}
						</button>
					</div>
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-3">
					<input
						className="rounded border px-3 py-1.5 text-sm"
						placeholder="Search name, email, team"
						value={filter.q}
						onChange={e => {
							setFilter({ q: e.target.value })
							setPagination(prev => ({ ...prev, page: 1 }))
						}}
					/>
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
					<p className="mt-4 text-sm text-slate-600">No users found.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
							<tr>
								<th className="px-3 py-2 text-left">
									<input
										type="checkbox"
										checked={allSelected}
										onChange={e => toggleAll(e.target.checked)}
									/>
								</th>
								<th className="px-3 py-2 text-left">Name</th>
								<th className="px-3 py-2 text-left">Email</th>
								<th className="px-3 py-2 text-left">Role</th>
								<th className="px-3 py-2 text-left">Type</th>
								<th className="px-3 py-2 text-left">Business Roles</th>
								<th className="px-3 py-2 text-left">Team</th>
								<th className="px-3 py-2 text-left">Status</th>
								<th className="px-3 py-2 text-left"></th>
							</tr>
							</thead>
							<tbody>
								{rows.map(user => (
								<tr key={user.id} className="border-t">
									<td className="px-3 py-2">
										<input
											type="checkbox"
											checked={Boolean(selected[user.id])}
											onChange={e =>
												setSelected(prev => ({ ...prev, [user.id]: e.target.checked }))
											}
										/>
									</td>
									<td className="px-3 py-2">{user.name}</td>
										<td className="px-3 py-2">{user.email}</td>
								<td className="px-3 py-2">{user.role}</td>
								<td className="px-3 py-2">{getUserTypeLabel(user.userType)}</td>
								<td className="px-3 py-2 text-xs">
									{user.businessRoles?.map(role => role.name).join(', ') || '-'}
								</td>
								<td className="px-3 py-2">{user.team || '-'}</td>
										<td className="px-3 py-2">
											{(() => {
												const meta = statusLabel(user)
												return (
													<span className={`rounded px-2 py-0.5 text-xs ${meta.className}`}>
														{meta.label}
													</span>
												)
											})()}
										</td>
										<td className="px-3 py-2 text-right">
											<div className="flex justify-end gap-2">
												{user.status === 'PENDING' && (
													<button
														className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
														onClick={() => approveUser(user)}
													>
														Approve
													</button>
												)}
												{user.status === 'INVITED' && (
													<button
														className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
														onClick={() => resendInvite(user)}
													>
														Resend invite
													</button>
												)}
												{user.status === 'ACTIVE' && (
													<button
														className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
														onClick={() => resetPassword(user)}
													>
														Reset password
													</button>
												)}
												<button
													className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
													onClick={() => openEdit(user)}
												>
													Edit
												</button>
												<button
													className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
													onClick={() => removeUser(user.id)}
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
							onPageChange={load}
							disabled={loading}
						/>
					</div>
				)}
			</div>

			{(editing || showCreate) && (
				<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-xl rounded border bg-white p-5 shadow-lg">
						<h2 className="text-lg font-semibold">{showCreate ? 'Create User' : 'Edit User'}</h2>
						{showCreate && (
							<div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
								<input
									type="checkbox"
									checked={inviteMode}
									onChange={e => setInviteMode(e.target.checked)}
								/>
								<span>Send invite (no password required)</span>
							</div>
						)}
						<div className="mt-3 grid gap-3">
							<label className="text-sm">
								<span className="font-medium">Email</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2"
									value={editForm.email}
									onChange={e => setEditForm({ ...editForm, email: e.target.value })}
									placeholder={editForm.name ? `${editForm.name.split(' ')[0]?.toLowerCase() || 'user'}@it-serve.qa` : 'firstName@it-serve.qa'}
								/>
								<p className="mt-1 text-[11px] text-slate-500">
									Leave blank to use the default: firstName@it-serve.qa
								</p>
							</label>
							<label className="text-sm">
								<span className="font-medium">Name</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2"
									value={editForm.name}
									onChange={e => setEditForm({ ...editForm, name: e.target.value })}
								/>
							</label>
							<div className="grid gap-3 md:grid-cols-2">
								<label className="text-sm">
									<span className="font-medium">Role</span>
									<select
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.role}
										onChange={e => setEditForm({ ...editForm, role: e.target.value })}
									>
										<option value="ADMIN">ADMIN</option>
										<option value="MANAGER">MANAGER</option>
										<option value="CONTRIBUTOR">CONTRIBUTOR</option>
										<option value="VIEWER">VIEWER</option>
									</select>
								</label>
								<label className="text-sm">
									<span className="font-medium">Team</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2"
										value={editForm.team}
										onChange={e => setEditForm({ ...editForm, team: e.target.value })}
									/>
								</label>
							</div>
							<label className="text-sm">
								<span className="font-medium">User Type</span>
								<select
									className="mt-1 w-full rounded border px-3 py-2"
									value={editForm.userType}
									onChange={e => setEditForm({ ...editForm, userType: e.target.value })}
								>
									{USER_TYPE_OPTIONS.map(type => (
										<option key={type.value} value={type.value}>
											{type.label}
										</option>
									))}
								</select>
							</label>
							<label className="text-sm">
								<span className="font-medium">Business Roles</span>
								<select
									multiple
									className="mt-1 w-full rounded border px-3 py-2"
									value={editForm.businessRoleIds}
									onChange={e => {
										const selectedRoles = Array.from(e.target.selectedOptions).map(opt => opt.value)
										setEditForm({ ...editForm, businessRoleIds: selectedRoles })
									}}
								>
									{businessRoles.map(role => (
										<option key={role.id} value={role.id}>
											{role.name}
										</option>
									))}
								</select>
								<p className="mt-1 text-[11px] text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
							</label>
							{!inviteMode && (
								<div className="grid gap-3 md:grid-cols-2">
									<label className="text-sm">
										<span className="font-medium">Status</span>
										<select
											className="mt-1 w-full rounded border px-3 py-2"
											value={editForm.status}
											onChange={e =>
												setEditForm({
													...editForm,
													status: e.target.value,
													isActive: e.target.value === 'ACTIVE'
												})
											}
										>
											<option value="ACTIVE">Active</option>
											<option value="DISABLED">Disabled</option>
											<option value="PENDING">Pending</option>
											<option value="INVITED">Invited</option>
										</select>
									</label>
									<label className="text-sm">
										<span className="font-medium">Password</span>
										<input
											type="password"
											className="mt-1 w-full rounded border px-3 py-2"
											value={editForm.password}
											onChange={e => setEditForm({ ...editForm, password: e.target.value })}
										/>
									</label>
									<label className="text-sm">
										<span className="font-medium">Force password change</span>
										<select
											className="mt-1 w-full rounded border px-3 py-2"
											value={editForm.mustChangePassword ? 'yes' : 'no'}
											onChange={e =>
												setEditForm({ ...editForm, mustChangePassword: e.target.value === 'yes' })
											}
										>
											<option value="no">No</option>
											<option value="yes">Yes</option>
										</select>
									</label>
								</div>
							)}
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
								onClick={() => {
									setEditing(null)
									setShowCreate(false)
								}}
								disabled={saving}
							>
								Cancel
							</button>
							<button
								className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
								onClick={showCreate ? createUser : saveEdit}
								disabled={saving || (!editForm.email && !editForm.name)}
							>
								{saving ? 'Saving...' : showCreate ? 'Create' : 'Save'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
