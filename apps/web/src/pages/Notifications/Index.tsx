import { useEffect, useMemo, useState } from 'react'
import {
	api,
	BusinessRole,
	NotificationChannel,
	NotificationDigestMode,
	NotificationItem,
	NotificationPreference,
	NotificationRoutingDefault,
	UserAccount
} from '../../api/client'
import { getUserRole } from '../../utils/auth'

const activityOptions = [
	{ value: 'opportunity.created', label: 'Opportunity created' },
	{ value: 'review.requested', label: 'Review requested' },
	{ value: 'sla', label: 'SLA reminders' }
]

const channelLabels: Record<NotificationChannel, string> = {
	EMAIL: 'Email',
	IN_APP: 'In-app'
}

const digestOptions: Array<{ value: NotificationDigestMode; label: string }> = [
	{ value: 'INSTANT', label: 'Instant' },
	{ value: 'DAILY', label: 'Daily' },
	{ value: 'WEEKLY', label: 'Weekly' },
	{ value: 'OFF', label: 'Off' }
]

type PreferenceState = Record<
	string,
	Record<NotificationChannel, { enabled: boolean; digestMode: NotificationDigestMode }>
>

export default function NotificationsPage() {
	const role = getUserRole()
	const isAdmin = role === 'ADMIN'
	const [notifications, setNotifications] = useState<NotificationItem[]>([])
	const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 })
	const [loading, setLoading] = useState(true)
	const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('unread')
	const [error, setError] = useState<string | null>(null)

	const [preferences, setPreferences] = useState<PreferenceState>({})
	const [savingPrefs, setSavingPrefs] = useState(false)

	const [defaults, setDefaults] = useState<NotificationRoutingDefault[]>([])
	const [defaultDrafts, setDefaultDrafts] = useState<NotificationRoutingDefault[]>([])
	const [roles, setRoles] = useState<BusinessRole[]>([])
	const [users, setUsers] = useState<UserAccount[]>([])
	const [savingDefaults, setSavingDefaults] = useState(false)

	const prefDefaults = useMemo(() => {
		const map: PreferenceState = {}
		for (const activity of activityOptions) {
			map[activity.value] = {
				EMAIL: { enabled: true, digestMode: 'INSTANT' },
				IN_APP: { enabled: true, digestMode: 'INSTANT' }
			}
		}
		return map
	}, [])

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

	async function loadPreferences() {
		try {
			const rows = await api.listNotificationPreferences()
			const map: PreferenceState = JSON.parse(JSON.stringify(prefDefaults))
			rows.forEach(pref => {
				if (!map[pref.activity]) {
					map[pref.activity] = {
						EMAIL: { enabled: true, digestMode: 'INSTANT' },
						IN_APP: { enabled: true, digestMode: 'INSTANT' }
					}
				}
				map[pref.activity][pref.channel] = {
					enabled: pref.enabled,
					digestMode: pref.digestMode
				}
			})
			setPreferences(map)
		} catch (e: any) {
			setError(e.message || 'Failed to load preferences')
		}
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
			setDefaultDrafts(defaultsRows.map(row => ({ ...row })))
			setRoles(roleRows)
			setUsers(userRows.items)
		} catch (e: any) {
			setError(e.message || 'Failed to load defaults')
		}
	}

	useEffect(() => {
		loadNotifications()
		loadPreferences()
		loadDefaults()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	function updatePreference(activity: string, channel: NotificationChannel, patch: Partial<{ enabled: boolean; digestMode: NotificationDigestMode }>) {
		setPreferences(prev => ({
			...prev,
			[activity]: {
				...prev[activity],
				[channel]: { ...prev[activity][channel], ...patch }
			}
		}))
	}

	async function savePreferences() {
		setSavingPrefs(true)
		setError(null)
		try {
			const items: Array<Omit<NotificationPreference, 'id' | 'userId'>> = []
			for (const activity of Object.keys(preferences)) {
				for (const channel of Object.keys(preferences[activity]) as NotificationChannel[]) {
					const pref = preferences[activity][channel]
					items.push({
						activity,
						channel,
						enabled: pref.enabled,
						digestMode: pref.digestMode
					})
				}
			}
			await api.saveNotificationPreferences(items)
		} catch (e: any) {
			setError(e.message || 'Failed to save preferences')
		}
		setSavingPrefs(false)
	}

	async function saveDefaults() {
		setSavingDefaults(true)
		setError(null)
		try {
			const items = defaultDrafts.map(row => ({
				activity: row.activity,
				stage: row.stage || undefined,
				userIds: row.userIds || [],
				businessRoleIds: row.businessRoleIds || []
			}))
			await api.saveNotificationDefaults(items)
			setDefaults(defaultDrafts)
		} catch (e: any) {
			setError(e.message || 'Failed to save defaults')
		}
		setSavingDefaults(false)
	}

	function addDefaultRow() {
		setDefaultDrafts(prev => [
			...prev,
			{
				id: `new-${Date.now()}`,
				tenantId: 'default',
				activity: activityOptions[0].value,
				stage: null,
				userIds: [],
				businessRoleIds: []
			}
		])
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="mx-auto max-w-6xl p-6">
				<div>
					<h1 className="text-xl font-semibold">Notifications</h1>
					<p className="text-sm text-slate-600">Track alerts and manage your notification preferences.</p>
				</div>

				{error && <p className="mt-3 text-sm text-red-600">{error}</p>}

				<div className="mt-4 rounded border bg-white p-4 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-sm font-semibold">Inbox</h2>
							<p className="text-xs text-slate-500">In-app notifications sent to your account.</p>
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
								className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
								onClick={() => loadNotifications(pagination.page)}
								disabled={loading}
							>
								Refresh
							</button>
							<button
								className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
								onClick={() => api.markAllNotificationsRead().then(() => loadNotifications(1))}
							>
								Mark all read
							</button>
						</div>
					</div>
					{loading ? (
						<p className="mt-3 text-sm text-slate-600">Loading...</p>
					) : notifications.length === 0 ? (
						<p className="mt-3 text-sm text-slate-600">No notifications to show.</p>
					) : (
						<div className="mt-3 space-y-2">
							{notifications.map(note => (
								<div key={note.id} className="rounded border border-slate-200 p-3">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-medium">{note.subject || note.activity}</p>
											{note.body && <p className="text-xs text-slate-600">{note.body}</p>}
										</div>
										{!note.readAt && (
											<button
												className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
												onClick={() => api.markNotificationRead(note.id).then(() => loadNotifications(pagination.page))}
											>
												Mark read
											</button>
										)}
									</div>
									<p className="mt-2 text-[11px] text-slate-500">
										{note.createdAt?.slice(0, 10)} · {note.activity}
									</p>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="mt-6 rounded border bg-white p-4 shadow-sm">
					<div>
						<h2 className="text-sm font-semibold">My Preferences</h2>
						<p className="text-xs text-slate-500">Choose how you want to be notified by activity.</p>
					</div>
					<div className="mt-3 overflow-x-auto">
						<table className="min-w-full text-xs">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-2 py-2 text-left">Activity</th>
									<th className="px-2 py-2 text-left">Email</th>
									<th className="px-2 py-2 text-left">In-app</th>
								</tr>
							</thead>
							<tbody>
								{activityOptions.map(option => {
									const pref = preferences[option.value] || prefDefaults[option.value]
									return (
										<tr key={option.value} className="border-t">
											<td className="px-2 py-2 font-medium">{option.label}</td>
											<td className="px-2 py-2">
												<div className="flex items-center gap-2">
													<input
														type="checkbox"
														checked={pref.EMAIL.enabled}
														onChange={e => updatePreference(option.value, 'EMAIL', { enabled: e.target.checked })}
													/>
													{option.value === 'sla' && (
														<select
															className="rounded border px-2 py-1 text-[11px]"
															value={pref.EMAIL.digestMode}
															onChange={e =>
																updatePreference(option.value, 'EMAIL', {
																	digestMode: e.target.value as NotificationDigestMode
																})
															}
														>
															{digestOptions.map(d => (
																<option key={d.value} value={d.value}>
																	{d.label}
																</option>
															))}
														</select>
													)}
												</div>
											</td>
											<td className="px-2 py-2">
												<label className="flex items-center gap-2">
													<input
														type="checkbox"
														checked={pref.IN_APP.enabled}
														onChange={e => updatePreference(option.value, 'IN_APP', { enabled: e.target.checked })}
													/>
													{channelLabels.IN_APP}
												</label>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
					<div className="mt-3 flex justify-end">
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
							onClick={savePreferences}
							disabled={savingPrefs}
						>
							{savingPrefs ? 'Saving...' : 'Save Preferences'}
						</button>
					</div>
				</div>

				{isAdmin && (
					<div className="mt-6 rounded border bg-white p-4 shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold">Default Routing</h2>
								<p className="text-xs text-slate-500">Set fallback recipients per activity and stage.</p>
							</div>
							<div className="flex gap-2">
								<button
									className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
									onClick={addDefaultRow}
								>
									Add default
								</button>
								<button
									className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
									onClick={saveDefaults}
									disabled={savingDefaults}
								>
									{savingDefaults ? 'Saving...' : 'Save defaults'}
								</button>
							</div>
						</div>
						<div className="mt-3 space-y-3">
							{defaultDrafts.map((row, idx) => (
								<div key={row.id} className="rounded border border-slate-200 p-3 text-xs">
									<div className="grid gap-3 md:grid-cols-3">
										<label className="text-xs">
											<span className="font-medium">Activity</span>
											<select
												className="mt-1 w-full rounded border px-2 py-1"
												value={row.activity}
												onChange={e => {
													const next = [...defaultDrafts]
													next[idx] = { ...row, activity: e.target.value }
													setDefaultDrafts(next)
												}}
											>
												{activityOptions.map(option => (
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
												value={row.stage || ''}
												onChange={e => {
													const next = [...defaultDrafts]
													next[idx] = { ...row, stage: e.target.value || null }
													setDefaultDrafts(next)
												}}
											/>
										</label>
										<label className="text-xs">
											<span className="font-medium">Business Roles</span>
											<select
												multiple
												className="mt-1 w-full rounded border px-2 py-1"
												value={row.businessRoleIds}
												onChange={e => {
													const selected = Array.from(e.target.selectedOptions).map(opt => opt.value)
													const next = [...defaultDrafts]
													next[idx] = { ...row, businessRoleIds: selected }
													setDefaultDrafts(next)
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
												value={row.userIds}
												onChange={e => {
													const selected = Array.from(e.target.selectedOptions).map(opt => opt.value)
													const next = [...defaultDrafts]
													next[idx] = { ...row, userIds: selected }
													setDefaultDrafts(next)
												}}
											>
												{users.map(user => (
													<option key={user.id} value={user.id}>
														{user.name} ({user.email})
													</option>
												))}
											</select>
											<p className="mt-1 text-[11px] text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
										</label>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
