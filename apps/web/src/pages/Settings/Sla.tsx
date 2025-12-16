import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Page } from '../../components/Page'

export default function SlaSettingsPage() {
	const slaQuery = useQuery({ queryKey: ['sla'], queryFn: api.getSlaSettings })
	const [form, setForm] = useState({ warnDays: 7, alertDays: 3, urgentDays: 1 })

	useEffect(() => {
		if (slaQuery.data) setForm(slaQuery.data)
	}, [slaQuery.data])

	const mutation = useMutation({
		mutationFn: () => api.setSlaSettings(form),
		onSuccess: data => setForm(data)
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
		</Page>
	)
}

