import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, NotificationChannel, NotificationDigestMode, NotificationPreference, UserAccount } from '../../api/client'
import Button from '../../components/ui/Button'
import { Page } from '../../components/Page'
import { toast } from '../../utils/toast'
import { channelLabels, digestOptions, notificationActivities } from '../../constants/notification-activities'

type PreferenceState = Record<
	string,
	Record<NotificationChannel, { enabled: boolean; digestMode: NotificationDigestMode }>
>

export default function AccountPage() {
	const navigate = useNavigate()
	const [user, setUser] = useState<UserAccount | null>(null)
	const [profile, setProfile] = useState({ name: '', email: '' })
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [savingProfile, setSavingProfile] = useState(false)
	const [savingPrefs, setSavingPrefs] = useState(false)
	const [preferences, setPreferences] = useState<PreferenceState>({})

	const prefDefaults = useMemo(() => {
		const map: PreferenceState = {}
		for (const activity of notificationActivities) {
			map[activity.value] = {
				EMAIL: { enabled: true, digestMode: 'INSTANT' },
				IN_APP: { enabled: true, digestMode: 'INSTANT' }
			}
		}
		return map
	}, [])

	const loadAccount = async () => {
		setLoading(true)
		setError(null)
		try {
			const [userRow, prefRows] = await Promise.all([api.getCurrentUser(), api.listNotificationPreferences()])
			setUser(userRow)
			setProfile({
				name: userRow.name || '',
				email: userRow.email || ''
			})
			const map: PreferenceState = JSON.parse(JSON.stringify(prefDefaults))
			prefRows.forEach(pref => {
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
		} catch (err: any) {
			setError(err?.message || 'Failed to load account data')
		}
		setLoading(false)
	}

	useEffect(() => {
		loadAccount()
	}, [])

	const updatePreference = (
		activity: string,
		channel: NotificationChannel,
		patch: Partial<{ enabled: boolean; digestMode: NotificationDigestMode }>
	) => {
		setPreferences(prev => ({
			...prev,
			[activity]: {
				...prev[activity],
				[channel]: { ...prev[activity][channel], ...patch }
			}
		}))
	}

	const saveProfile = async () => {
		if (!user) return
		setSavingProfile(true)
		setError(null)
		try {
			const updated = await api.updateUser(user.id, {
				name: profile.name.trim(),
				email: profile.email.trim()
			})
			setUser(updated)
			setProfile({
				name: updated.name || '',
				email: updated.email || ''
			})
			toast.success('Profile updated')
		} catch (err: any) {
			setError(err?.message || 'Failed to save profile')
		}
		setSavingProfile(false)
	}

	const savePreferences = async () => {
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
			toast.success('Preferences saved')
		} catch (err: any) {
			setError(err?.message || 'Failed to save preferences')
		}
		setSavingPrefs(false)
	}

	if (loading) {
		return (
			<Page title="Account settings" subtitle="Manage your profile, security, and notifications">
				<p className="text-sm text-muted-foreground">Loading account settings...</p>
			</Page>
		)
	}

	return (
		<Page
			title="Account settings"
			subtitle="Manage your profile, security, and notification preferences."
			actions={
				<Button size="sm" variant="ghost" onClick={() => navigate('/auth/change-password')}>
					Change password
				</Button>
			}
		>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<div className="rounded border border-border bg-card p-4 shadow-sm">
					<h2 className="text-sm font-semibold text-muted-foreground">Personal information</h2>
					<p className="text-xs text-muted-foreground">Update your name and email for this tenant.</p>
					<div className="mt-3 space-y-3 text-xs">
						<label className="block">
							<span className="font-medium text-muted-foreground">Full name</span>
							<input
								className="mt-1 w-full rounded border px-3 py-2 text-sm"
								value={profile.name}
								onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
							/>
						</label>
						<label className="block">
							<span className="font-medium text-muted-foreground">Email</span>
							<input
								className="mt-1 w-full rounded border px-3 py-2 text-sm"
								value={profile.email}
								onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
							/>
						</label>
						<div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
							<div>
								<span className="font-semibold text-foreground">Role:</span> {user?.role || '—'}
							</div>
							<div>
								<span className="font-semibold text-foreground">Status:</span> {user?.status || '—'}
							</div>
							<div>
								<span className="font-semibold text-foreground">Tenant:</span> {user?.tenantId}
							</div>
						</div>
						<div className="flex justify-end">
							<Button size="sm" variant="primary" onClick={saveProfile} disabled={!user || savingProfile}>
								{savingProfile ? 'Saving…' : 'Save profile'}
							</Button>
						</div>
					</div>
				</div>
				<div className="rounded border border-border bg-card p-4 shadow-sm">
					<h2 className="text-sm font-semibold text-muted-foreground">Notification preferences</h2>
					<p className="text-xs text-muted-foreground">Personalize how you receive alerts.</p>
					<div className="mt-3 overflow-x-auto">
						<table className="min-w-full text-xs">
							<thead className="bg-muted">
								<tr>
									<th className="px-2 py-2 text-left">Activity</th>
									<th className="px-2 py-2 text-left">Email</th>
									<th className="px-2 py-2 text-left">In-app</th>
								</tr>
							</thead>
							<tbody>
								{notificationActivities.map(activity => {
									const pref = preferences[activity.value] || prefDefaults[activity.value]
									return (
										<tr key={activity.value} className="border-t">
											<td className="px-2 py-2 font-medium">{activity.label}</td>
											<td className="px-2 py-2">
												<div className="flex items-center gap-2">
													<input
														type="checkbox"
														checked={pref.EMAIL.enabled}
														onChange={e => updatePreference(activity.value, 'EMAIL', { enabled: e.target.checked })}
													/>
													{activity.value === 'sla' && (
														<select
															className="rounded border px-2 py-1 text-[11px]"
															value={pref.EMAIL.digestMode}
															onChange={e =>
																updatePreference(activity.value, 'EMAIL', {
																	digestMode: e.target.value as NotificationDigestMode
																})
															}
														>
															{digestOptions.map(option => (
																<option key={option.value} value={option.value}>
																	{option.label}
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
														onChange={e => updatePreference(activity.value, 'IN_APP', { enabled: e.target.checked })}
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
						<Button size="sm" variant="primary" onClick={savePreferences} disabled={savingPrefs}>
							{savingPrefs ? 'Saving…' : 'Save notification preferences'}
						</Button>
					</div>
				</div>
			</div>
		</Page>
	)
}
