import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
	api,
	BusinessRole,
	NotificationItem,
	NotificationRoutingDefault,
	UserAccount
} from '../../api/client'
import { getUserRole } from '../../utils/auth'
import { notificationActivities } from '../../constants/notification-activities'
import { getNotificationLink } from '../../utils/notifications'

function formatPayloadValue(value: unknown) {
	if (value === null || value === undefined) {
		return '—'
	}
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value)
		} catch {
			return String(value)
		}
	}
	return String(value)
}

function payloadEntries(payload: unknown): Array<[string, unknown]> {
	if (payload === null || payload === undefined) return []
	if (typeof payload === 'object' && !Array.isArray(payload)) {
		return Object.entries(payload)
	}
	return [['value', payload]]
}

export default function NotificationsPage() {
	const nav = useNavigate()
	const role = getUserRole()
	const isAdmin = role === 'ADMIN'
	const [notifications, setNotifications] = useState<NotificationItem[]>([])
	const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 })
	const [loading, setLoading] = useState(true)
	const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('unread')
	const [error, setError] = useState<string | null>(null)

	const [defaults, setDefaults] = useState<NotificationRoutingDefault[]>([])
	const [roles, setRoles] = useState<BusinessRole[]>([])
	const [users, setUsers] = useState<UserAccount[]>([])
	const [savingDefaults, setSavingDefaults] = useState(false)
	const [editingDefault, setEditingDefault] = useState<NotificationRoutingDefault | null>(null)
	const [defaultDraft, setDefaultDraft] = useState<{
		activity: string
		stage: string
		userIds: string[]
		businessRoleIds: string[]
	}>({
		activity: notificationActivities[0]?.value || '',
		stage: '',
		userIds: [],
		businessRoleIds: []
	})

	const queryClient = useQueryClient()

	async function loadNotifications(pageOverride?: number, statusOverride?: 'all' | 'unread') {
		setLoading(true)
		setError(null)
		try {
			const status = statusOverride || statusFilter
			const data = await api.listNotifications({
				page: pageOverride || pagination.page,
				pageSize: pagination.pageSize,
				status: status === 'unread' ? 'unread' : undefined
			})
			setNotifications(data.items)
			setPagination({ page: data.page, pageSize: data.pageSize, total: data.total })
		} catch (e: any) {
			setError(e.message || 'Failed to load notifications')
		}
		setLoading(false)
	}

	async function loadDefaults() {
		if (!isAdmin) return
		try {
			const [defaultsRows, roleRows, userRows] = await Promise.all([
				api.listNotificationDefaults(),
				api.listBusinessRoles(),
				api.listUsers({ pageSize: 200 })
			])
			setDefaults(defaultsRows)
			setRoles(roleRows)
			setUsers(userRows.items)
		} catch (e: any) {
			setError(e.message || 'Failed to load defaults')
		}
	}

	async function handleMarkRead(id: string) {
		setError(null)
		try {
			await api.markNotificationRead(id)
			await loadNotifications(pagination.page)
			await queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
		} catch (e: any) {
			setError(e.message || 'Failed to update notification')
		}
	}

	async function handleMarkUnread(id: string) {
		setError(null)
		try {
			await api.markNotificationUnread(id)
			await loadNotifications(pagination.page)
			await queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
		} catch (e: any) {
			setError(e.message || 'Failed to update notification')
		}
	}

	function openNotification(note: NotificationItem) {
		const link = getNotificationLink(note)
		if (!link) return
		if (!note.readAt) {
			void handleMarkRead(note.id)
		}
		if (link.external) {
			window.open(link.href, '_blank', 'noopener,noreferrer')
			return
		}
		nav(link.href)
	}

	async function handleMarkAllRead() {
		setError(null)
		try {
			await api.markAllNotificationsRead()
			await loadNotifications(1)
			await queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
		} catch (e: any) {
			setError(e.message || 'Failed to mark all notifications read')
		}
	}

	useEffect(() => {
		loadNotifications()
		loadDefaults()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	async function saveDefault() {
		setSavingDefaults(true)
		setError(null)
		try {
			const stageValue = defaultDraft.stage.trim()
			if (
				editingDefault &&
				(editingDefault.activity !== defaultDraft.activity ||
					(editingDefault.stage || '') !== stageValue)
			) {
				await api.deleteNotificationDefault(editingDefault.id)
			}
			await api.saveNotificationDefaults([
				{
					activity: defaultDraft.activity,
					stage: stageValue || undefined,
					userIds: defaultDraft.userIds,
					businessRoleIds: defaultDraft.businessRoleIds
				}
			])
			await loadDefaults()
			setEditingDefault(null)
					setDefaultDraft({
						activity: notificationActivities[0]?.value || '',
				stage: '',
				userIds: [],
				businessRoleIds: []
			})
		} catch (e: any) {
			setError(e.message || 'Failed to save defaults')
		}
		setSavingDefaults(false)
	}

	function startEditDefault(row: NotificationRoutingDefault) {
		setEditingDefault(row)
		setDefaultDraft({
			activity: row.activity,
			stage: row.stage || '',
			userIds: row.userIds || [],
			businessRoleIds: row.businessRoleIds || []
		})
	}

	async function deleteDefault(row: NotificationRoutingDefault) {
		setSavingDefaults(true)
		setError(null)
		try {
			await api.deleteNotificationDefault(row.id)
			await loadDefaults()
			if (editingDefault?.id === row.id) {
				setEditingDefault(null)
										setDefaultDraft({
											activity: notificationActivities[0]?.value || '',
					stage: '',
					userIds: [],
					businessRoleIds: []
				})
			}
		} catch (e: any) {
			setError(e.message || 'Failed to delete default')
		}
		setSavingDefaults(false)
	}

	return (
		<div className="min-h-screen bg-muted text-foreground">
			<div className="mx-auto max-w-6xl p-6">
				<div>
					<h1 className="text-xl font-semibold">Notifications</h1>
					<p className="text-sm text-muted-foreground">Track alerts and manage your notification preferences.</p>
				</div>

				{error && <p className="mt-3 text-sm text-destructive">{error}</p>}

				<div className="mt-4 rounded border bg-card p-4 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-sm font-semibold">Inbox</h2>
							<p className="text-xs text-muted-foreground">In-app notifications sent to your account.</p>
						</div>
						<div className="flex items-center gap-2">
							<select
								className="rounded border px-2 py-1 text-xs"
								value={statusFilter}
								onChange={e => {
									const next = e.target.value as 'all' | 'unread'
									setStatusFilter(next)
									loadNotifications(1, next)
								}}
							>
								<option value="unread">Unread</option>
								<option value="all">All</option>
							</select>
							<button
								className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
								onClick={() => loadNotifications(pagination.page)}
								disabled={loading}
							>
								Refresh
							</button>
							<button
								className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
								onClick={handleMarkAllRead}
								disabled={loading}
							>
								Mark all read
							</button>
						</div>
					</div>
					{loading ? (
						<p className="mt-3 text-sm text-muted-foreground">Loading...</p>
					) : notifications.length === 0 ? (
						<p className="mt-3 text-sm text-muted-foreground">No notifications to show.</p>
					) : (
						<div className="mt-3 space-y-2">
							{notifications.map(note => (
								<div
									key={note.id}
									role="button"
									tabIndex={0}
									className="cursor-pointer rounded border border-border p-3 transition hover:bg-muted/80"
									onClick={() => openNotification(note)}
									onKeyDown={event => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault()
											openNotification(note)
										}
									}}
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-medium">{note.subject || note.activity}</p>
											{note.body && <p className="text-xs text-muted-foreground">{note.body}</p>}
										</div>
										<div className="flex gap-2">
											{!note.readAt && (
												<button
													className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
													onClick={event => {
														event.stopPropagation()
														handleMarkRead(note.id)
													}}
												>
													Mark read
												</button>
											)}
											{note.readAt && (
												<button
													className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
													onClick={event => {
														event.stopPropagation()
														handleMarkUnread(note.id)
													}}
												>
													Mark unread
												</button>
											)}
										</div>
									</div>
									<p className="mt-2 text-[11px] text-muted-foreground">
										{note.createdAt?.slice(0, 10)} · {note.activity}
									</p>
									{note.opportunityId && (
										<p className="mt-1 text-[11px] text-muted-foreground">Opportunity: {note.opportunityId}</p>
									)}
									{note.payload && (
										<div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
											{payloadEntries(note.payload).map(([key, value]) => (
												<span key={key} className="rounded border border-border px-2 py-0.5">
													{`${key}: ${formatPayloadValue(value)}`}
												</span>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				{/* Personal notification preferences now live under /account */}

				{isAdmin && (
					<div className="mt-6 rounded border bg-card p-4 shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold">Default Routing</h2>
								<p className="text-xs text-muted-foreground">Set fallback recipients per activity and stage.</p>
							</div>
							<button
								className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
								onClick={saveDefault}
								disabled={savingDefaults}
							>
								{savingDefaults ? 'Saving...' : editingDefault ? 'Update default' : 'Save default'}
							</button>
						</div>
						<div className="mt-3 rounded border border-border p-3 text-xs">
							<div className="grid gap-3 md:grid-cols-3">
								<label className="text-xs">
									<span className="font-medium">Activity</span>
										<select
											className="mt-1 w-full rounded border px-2 py-1"
											value={defaultDraft.activity}
											onChange={e => setDefaultDraft(prev => ({ ...prev, activity: e.target.value }))}
										>
											{notificationActivities.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
								</label>
								<label className="text-xs">
									<span className="font-medium">Stage (optional)</span>
									<input
										className="mt-1 w-full rounded border px-2 py-1"
										value={defaultDraft.stage}
										onChange={e => setDefaultDraft(prev => ({ ...prev, stage: e.target.value }))}
									/>
								</label>
								<label className="text-xs">
									<span className="font-medium">Business Roles</span>
									<select
										multiple
										className="mt-1 w-full rounded border px-2 py-1"
										value={defaultDraft.businessRoleIds}
										onChange={e => {
											const selected = Array.from(e.target.selectedOptions).map(opt => opt.value)
											setDefaultDraft(prev => ({ ...prev, businessRoleIds: selected }))
										}}
									>
										{roles.map(role => (
											<option key={role.id} value={role.id}>
												{role.name}
											</option>
										))}
									</select>
								</label>
								<label className="text-xs md:col-span-3">
									<span className="font-medium">Direct Users</span>
									<select
										multiple
										className="mt-1 w-full rounded border px-2 py-1"
										value={defaultDraft.userIds}
										onChange={e => {
											const selected = Array.from(e.target.selectedOptions).map(opt => opt.value)
											setDefaultDraft(prev => ({ ...prev, userIds: selected }))
										}}
									>
										{users.map(user => (
											<option key={user.id} value={user.id}>
												{user.name} ({user.email})
											</option>
										))}
									</select>
									<p className="mt-1 text-[11px] text-muted-foreground">Hold Ctrl/Cmd to select multiple.</p>
								</label>
							</div>
							{editingDefault && (
								<div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
									<span>Editing existing default. Save will update or move this row.</span>
									<button
										className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80"
										onClick={() => {
											setEditingDefault(null)
											setDefaultDraft({
												activity: notificationActivities[0]?.value || '',
												stage: '',
												userIds: [],
												businessRoleIds: []
											})
										}}
									>
										Cancel edit
									</button>
								</div>
							)}
						</div>
						<div className="mt-4">
							<h3 className="text-xs font-semibold text-muted-foreground">Existing defaults</h3>
							<div className="mt-2 overflow-x-auto">
								<table className="min-w-full text-xs">
									<thead className="bg-muted">
										<tr>
											<th className="px-2 py-2 text-left">Activity</th>
											<th className="px-2 py-2 text-left">Stage</th>
											<th className="px-2 py-2 text-left">Business Roles</th>
											<th className="px-2 py-2 text-left">Direct Users</th>
											<th className="px-2 py-2 text-left">Actions</th>
										</tr>
									</thead>
									<tbody>
										{defaults.length === 0 ? (
											<tr className="border-t">
												<td className="px-2 py-3 text-muted-foreground" colSpan={5}>
													No defaults saved yet.
												</td>
											</tr>
										) : (
											defaults.map(row => (
												<tr key={row.id} className="border-t">
													<td className="px-2 py-2">
													{notificationActivities.find(option => option.value === row.activity)?.label || row.activity}
													</td>
													<td className="px-2 py-2">{row.stage || '—'}</td>
													<td className="px-2 py-2">
														{row.businessRoleIds?.length
															? row.businessRoleIds
																	.map(id => roles.find(role => role.id === id)?.name)
																	.filter(Boolean)
																	.join(', ')
															: '—'}
													</td>
													<td className="px-2 py-2">
														{row.userIds?.length
															? row.userIds
																	.map(id => users.find(user => user.id === id))
																	.filter(Boolean)
																	.map(user => `${user?.name} (${user?.email})`)
																	.join(', ')
															: '—'}
													</td>
													<td className="px-2 py-2">
														<div className="flex flex-wrap gap-2">
															<button
																className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
																onClick={() => startEditDefault(row)}
															>
																Edit
															</button>
															<button
																className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
																onClick={() => deleteDefault(row)}
															>
																Delete
															</button>
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
