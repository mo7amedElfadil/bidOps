import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Page } from '../../components/Page'

export default function SlaSettingsPage() {
	const slaQuery = useQuery({ queryKey: ['sla'], queryFn: api.getSlaSettings })
	const holidaysQuery = useQuery({ queryKey: ['sla-holidays'], queryFn: api.getHolidaySettings })
	const retentionQuery = useQuery({ queryKey: ['retention'], queryFn: api.getRetentionPolicy })
	const [form, setForm] = useState({ warnDays: 7, alertDays: 3, urgentDays: 1 })
	const [holidayText, setHolidayText] = useState('')
	const [retentionYears, setRetentionYears] = useState(5)

	useEffect(() => {
		if (slaQuery.data) setForm(slaQuery.data)
	}, [slaQuery.data])

	useEffect(() => {
		if (holidaysQuery.data) {
			setHolidayText(holidaysQuery.data.dates.join('\n'))
		}
	}, [holidaysQuery.data])

	useEffect(() => {
		if (retentionQuery.data) setRetentionYears(retentionQuery.data.years)
	}, [retentionQuery.data])

	const mutation = useMutation({
		mutationFn: () => api.setSlaSettings(form),
		onSuccess: data => setForm(data)
	})

	const holidaysMutation = useMutation({
		mutationFn: () =>
			api.setHolidaySettings({
				dates: holidayText
					.split(/[\n,]/)
					.map(d => d.trim())
					.filter(Boolean)
			}),
		onSuccess: data => setHolidayText(data.dates.join('\n'))
	})

	const retentionMutation = useMutation({
		mutationFn: () => api.setRetentionPolicy({ years: retentionYears }),
		onSuccess: data => setRetentionYears(data.years)
	})

	return (
		<Page
			title="SLA Settings"
			subtitle="Warn/alert/urgent thresholds affect SLA badges and timeline coloring."
			actions={
				<button
					className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
					onClick={() => mutation.mutate()}
					disabled={mutation.isPending}
				>
					{mutation.isPending ? 'Saving...' : 'Save'}
				</button>
			}
		>
			<div className="mt-4 rounded border bg-white p-4 shadow-sm">
				{slaQuery.isLoading ? (
					<p className="text-sm text-slate-600">Loading current settings...</p>
				) : (
					<div className="grid gap-4 sm:grid-cols-3">
						<label className="text-sm">
							<span className="font-medium">Warn days</span>
							<input
								type="number"
								className="mt-1 w-full rounded border px-3 py-2"
								value={form.warnDays}
								min={0}
								onChange={e => setForm({ ...form, warnDays: Number(e.target.value) })}
							/>
						</label>
						<label className="text-sm">
							<span className="font-medium">Alert days</span>
							<input
								type="number"
								className="mt-1 w-full rounded border px-3 py-2"
								value={form.alertDays}
								min={0}
								onChange={e => setForm({ ...form, alertDays: Number(e.target.value) })}
							/>
						</label>
						<label className="text-sm">
							<span className="font-medium">Urgent days</span>
							<input
								type="number"
								className="mt-1 w-full rounded border px-3 py-2"
								value={form.urgentDays}
								min={0}
								onChange={e => setForm({ ...form, urgentDays: Number(e.target.value) })}
							/>
						</label>
					</div>
				)}

				{mutation.error && (
					<p className="mt-3 text-sm text-red-600">
						Failed to save: {(mutation.error as Error).message}
					</p>
				)}
				{mutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-slate-600">
					API: GET/PUT /settings/sla (role: MANAGER/ADMIN to edit).
				</p>
			</div>

			<div className="mt-6 rounded border bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">Holiday Calendar</h3>
					<button
						className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300 disabled:opacity-50"
						onClick={() => holidaysMutation.mutate()}
						disabled={holidaysMutation.isPending}
					>
						{holidaysMutation.isPending ? 'Saving...' : 'Save'}
					</button>
				</div>
				<p className="mt-2 text-xs text-slate-600">
					Add one date per line in YYYY-MM-DD format. These dates can be used in SLA calculations.
				</p>
				<textarea
					className="mt-3 min-h-[120px] w-full rounded border px-3 py-2 text-sm"
					value={holidayText}
					onChange={e => setHolidayText(e.target.value)}
					placeholder="2026-01-01&#10;2026-02-18"
				/>
				{holidaysMutation.error && (
					<p className="mt-3 text-sm text-red-600">
						Failed to save: {(holidaysMutation.error as Error).message}
					</p>
				)}
				{holidaysMutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-slate-600">
					API: GET/PUT /settings/holidays (role: MANAGER/ADMIN to edit).
				</p>
			</div>

			<div className="mt-6 rounded border bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">Data Retention</h3>
					<button
						className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300 disabled:opacity-50"
						onClick={() => retentionMutation.mutate()}
						disabled={retentionMutation.isPending}
					>
						{retentionMutation.isPending ? 'Saving...' : 'Save'}
					</button>
				</div>
				<p className="mt-2 text-xs text-slate-600">
					Default retention is 5 years with external backups. Update if policy changes.
				</p>
				<input
					type="number"
					className="mt-3 w-full rounded border px-3 py-2 text-sm"
					min={1}
					value={retentionYears}
					onChange={e => setRetentionYears(Number(e.target.value))}
				/>
				{retentionMutation.error && (
					<p className="mt-3 text-sm text-red-600">
						Failed to save: {(retentionMutation.error as Error).message}
					</p>
				)}
				{retentionMutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-slate-600">
					API: GET/PUT /settings/retention (role: ADMIN to edit).
				</p>
			</div>
		</Page>
	)
}
