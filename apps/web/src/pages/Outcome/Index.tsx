import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, Outcome } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'

const REASON_CODES = [
	'Price too high',
	'Technical non-compliance',
	'Late submission',
	'Better competitor solution',
	'Client relationship',
	'Scope mismatch',
	'Timeline constraints',
	'Resource unavailability',
	'Strategic decision',
	'Other'
]

export default function OutcomePage() {
	const { id } = useParams<{ id: string }>()
	const [form, setForm] = useState({
		status: 'WON' as Outcome['status'],
		date: new Date().toISOString().split('T')[0],
		winner: '',
		awardValue: 0,
		notes: '',
		reasonCodes: [] as string[]
	})

	const outcome = useQuery({
		queryKey: ['outcome', id],
		enabled: Boolean(id),
		queryFn: () => api.getOutcome(id || '')
	})

	const save = useMutation({
		mutationFn: () => api.setOutcome(id || '', { ...form, date: form.date }),
		onSuccess: data =>
			setForm({
				status: data.status,
				date: data.date?.split('T')[0] || new Date().toISOString().split('T')[0],
				winner: data.winner || '',
				awardValue: data.awardValue || 0,
				notes: data.notes || '',
				reasonCodes: data.reasonCodes || []
			})
	})

	// hydrate form when outcome loads
	useEffect(() => {
		const data = outcome.data
		if (data) {
			setForm({
				status: data.status,
				date: data.date?.split('T')[0] || new Date().toISOString().split('T')[0],
				winner: data.winner || '',
				awardValue: data.awardValue || 0,
				notes: data.notes || '',
				reasonCodes: data.reasonCodes || []
			})
		}
	}, [outcome.data])

	function toggleReasonCode(code: string) {
		setForm(f => ({
			...f,
			reasonCodes: f.reasonCodes.includes(code)
				? f.reasonCodes.filter(c => c !== code)
				: [...f.reasonCodes, code]
		}))
	}

	const current = outcome.data

	return (
		<OpportunityShell active="outcome">
			<div className="p-6">
				{outcome.isLoading ? (
					<p className="text-sm text-slate-600">Loading...</p>
				) : (
					<div className="rounded border bg-white p-6 shadow-sm">
						{current && (
							<div className="mb-4 rounded bg-blue-50 p-3 text-sm">
								<span className="font-medium">Current Status:</span>{' '}
								<span
									className={`font-bold ${
										current.status === 'WON'
											? 'text-green-700'
											: current.status === 'LOST'
												? 'text-red-700'
												: 'text-amber-700'
									}`}
								>
									{current.status}
								</span>
								{current.awardValue && current.awardValue > 0 && (
									<span className="ml-2">• Award Value: {current.awardValue.toLocaleString()}</span>
								)}
							</div>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm font-medium">Outcome Status</label>
								<select
									className="mt-1 w-full rounded border p-2"
									value={form.status}
									onChange={e => setForm({ ...form, status: e.target.value as Outcome['status'] })}
								>
									<option value="WON">Won</option>
									<option value="LOST">Lost</option>
									<option value="WITHDRAWN">Withdrawn</option>
									<option value="CANCELLED">Cancelled</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium">Date</label>
								<input
									type="date"
									className="mt-1 w-full rounded border p-2"
									value={form.date}
									onChange={e => setForm({ ...form, date: e.target.value })}
								/>
							</div>

							{form.status === 'WON' && (
								<div>
									<label className="block text-sm font-medium">Award Value</label>
									<input
										type="number"
										className="mt-1 w-full rounded border p-2"
										value={form.awardValue}
										onChange={e => setForm({ ...form, awardValue: +e.target.value })}
									/>
								</div>
							)}

							{form.status === 'LOST' && (
								<div>
									<label className="block text-sm font-medium">Winner</label>
									<input
										className="mt-1 w-full rounded border p-2"
										placeholder="Competitor name"
										value={form.winner}
										onChange={e => setForm({ ...form, winner: e.target.value })}
									/>
								</div>
							)}

							<div className="sm:col-span-2">
								<label className="block text-sm font-medium">Notes</label>
								<textarea
									className="mt-1 w-full rounded border p-2"
									rows={3}
									placeholder="Additional notes, lessons learned..."
									value={form.notes}
									onChange={e => setForm({ ...form, notes: e.target.value })}
								/>
							</div>
						</div>

						{(form.status === 'LOST' || form.status === 'WITHDRAWN') && (
							<div className="mt-4">
								<label className="block text-sm font-medium">Reason Codes</label>
								<div className="mt-2 flex flex-wrap gap-2">
									{REASON_CODES.map(code => (
										<button
											key={code}
											type="button"
											className={`rounded border px-3 py-1 text-sm ${
												form.reasonCodes.includes(code)
													? 'border-blue-600 bg-blue-600 text-white'
													: 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
											}`}
											onClick={() => toggleReasonCode(code)}
										>
											{code}
										</button>
									))}
								</div>
							</div>
						)}

						<div className="mt-6">
							<button
								className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
								onClick={() => save.mutate()}
								disabled={save.isPending}
							>
								{save.isPending ? 'Saving...' : current ? 'Update Outcome' : 'Record Outcome'}
							</button>
							{save.error && (
								<p className="mt-2 text-sm text-red-600">
									{(save.error as Error).message || 'Failed to save outcome'}
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</OpportunityShell>
	)
}

