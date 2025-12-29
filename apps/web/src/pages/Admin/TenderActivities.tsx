import { useEffect, useMemo, useState } from 'react'
import { api, TenderActivity, TenderScope } from '../../api/client'

const scopeOptions: Array<{ value: TenderScope; label: string }> = [
	{ value: 'ITSQ', label: 'ITSQ' },
	{ value: 'IOT_SHABAKA', label: 'IoT Shabaka' },
	{ value: 'OTHER', label: 'Other' }
]

const initialForm = {
	name: '',
	description: '',
	scope: 'ITSQ' as TenderScope,
	keywords: '',
	negativeKeywords: '',
	weight: '',
	isHighPriority: false,
	isActive: true
}

function parseCsv(input: string) {
	return input
		.split(',')
		.map(entry => entry.trim())
		.filter(Boolean)
}

function toCsv(list?: string[]) {
	return list?.join(', ') ?? ''
}

export default function TenderActivitiesPage() {
	const [rows, setRows] = useState<TenderActivity[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [form, setForm] = useState(initialForm)
	const [editing, setEditing] = useState<TenderActivity | null>(null)
	const [saving, setSaving] = useState(false)
	const [reprocessRange, setReprocessRange] = useState({ fromDate: '', toDate: '', portal: '' })
	const [reprocessing, setReprocessing] = useState(false)
	const [reprocessMessage, setReprocessMessage] = useState<string | null>(null)
	const [translateRange, setTranslateRange] = useState({
		fromDate: '',
		toDate: '',
		portal: '',
		limit: '200',
		dryRun: false
	})
	const [translating, setTranslating] = useState(false)
	const [translateMessage, setTranslateMessage] = useState<string | null>(null)

	const totals = useMemo(() => {
		const active = rows.filter(row => row.isActive).length
		const highPriority = rows.filter(row => row.isHighPriority).length
		return { total: rows.length, active, highPriority }
	}, [rows])

	async function load() {
		setLoading(true)
		setError(null)
		try {
			const data = await api.listTenderActivities()
			setRows(data)
		} catch (e: any) {
			setError(e.message || 'Failed to load tender activities')
		}
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	function startEdit(activity: TenderActivity) {
		setEditing(activity)
		setForm({
			name: activity.name,
			description: activity.description || '',
			scope: activity.scope,
			keywords: toCsv(activity.keywords),
			negativeKeywords: toCsv(activity.negativeKeywords),
			weight: activity.weight !== null && activity.weight !== undefined ? String(activity.weight) : '',
			isHighPriority: activity.isHighPriority,
			isActive: activity.isActive
		})
	}

	async function save() {
		setSaving(true)
		setError(null)
		try {
			const payload = {
				name: form.name.trim(),
				description: form.description.trim() || undefined,
				scope: form.scope,
				keywords: parseCsv(form.keywords),
				negativeKeywords: parseCsv(form.negativeKeywords),
				weight: form.weight ? Number(form.weight) : undefined,
				isHighPriority: form.isHighPriority,
				isActive: form.isActive
			}
			if (editing) {
				await api.updateTenderActivity(editing.id, payload)
			} else {
				await api.createTenderActivity(payload)
			}
			setEditing(null)
			setForm(initialForm)
			await load()
		} catch (e: any) {
			setError(e.message || 'Failed to save activity')
		}
		setSaving(false)
	}

	async function runReprocess() {
		setReprocessing(true)
		setReprocessMessage(null)
		try {
			const res = await api.reprocessTenderClassifications({
				fromDate: reprocessRange.fromDate || undefined,
				toDate: reprocessRange.toDate || undefined,
				portal: reprocessRange.portal || undefined
			})
			const summary = `Reprocess done: ${res.processed} tenders, ${res.errors} errors.`
			const firstError = res.errorSamples?.[0]?.message
			setReprocessMessage(firstError ? `${summary} First error: ${firstError}` : summary)
		} catch (e: any) {
			setReprocessMessage(e.message || 'Reprocess failed')
		}
		setReprocessing(false)
	}

	async function runTranslate() {
		setTranslating(true)
		setTranslateMessage(null)
		try {
			const limit = translateRange.limit ? Number(translateRange.limit) : undefined
			const res = await api.translateTenderTitles({
				fromDate: translateRange.fromDate || undefined,
				toDate: translateRange.toDate || undefined,
				portal: translateRange.portal || undefined,
				limit: Number.isFinite(limit) ? limit : undefined,
				dryRun: translateRange.dryRun || undefined
			})
			const summary = `Translate done: ${res.translated}/${res.scanned}, skipped ${res.skipped}, failed ${res.failed}.`
			setTranslateMessage(summary)
		} catch (e: any) {
			setTranslateMessage(e.message || 'Translate failed')
		}
		setTranslating(false)
	}

	return (
		<div className="min-h-screen bg-muted text-foreground">
			<div className="mx-auto max-w-5xl p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold">Tender Activities</h1>
						<p className="text-sm text-muted-foreground">
							Manage smart filter keywords and trigger reprocessing.
						</p>
					</div>
					<button
						className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
						onClick={() => load()}
						disabled={loading}
					>
						Refresh
					</button>
				</div>

				<div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<div className="rounded border bg-card p-4 shadow-sm">
						<h2 className="text-sm font-semibold">{editing ? 'Edit Activity' : 'Add Activity'}</h2>
						<div className="mt-3 grid gap-3 md:grid-cols-2">
							<label className="text-sm">
								<span className="font-medium">Name</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.name}
									onChange={e => setForm({ ...form, name: e.target.value })}
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Scope</span>
								<select
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.scope}
									onChange={e => setForm({ ...form, scope: e.target.value as TenderScope })}
								>
									{scopeOptions.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>
							<label className="text-sm md:col-span-2">
								<span className="font-medium">Description</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.description}
									onChange={e => setForm({ ...form, description: e.target.value })}
								/>
							</label>
							<label className="text-sm md:col-span-2">
								<span className="font-medium">Keywords (comma separated)</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.keywords}
									onChange={e => setForm({ ...form, keywords: e.target.value })}
								/>
							</label>
							<label className="text-sm md:col-span-2">
								<span className="font-medium">Negative keywords (comma separated)</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.negativeKeywords}
									onChange={e => setForm({ ...form, negativeKeywords: e.target.value })}
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Weight</span>
								<input
									type="number"
									step="0.1"
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.weight}
									onChange={e => setForm({ ...form, weight: e.target.value })}
								/>
							</label>
							<div className="text-sm">
								<span className="font-medium">Flags</span>
								<div className="mt-2 flex flex-wrap gap-3">
									<label className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={form.isHighPriority}
											onChange={e => setForm({ ...form, isHighPriority: e.target.checked })}
										/>
										High priority
									</label>
									<label className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={form.isActive}
											onChange={e => setForm({ ...form, isActive: e.target.checked })}
										/>
										Active
									</label>
								</div>
							</div>
						</div>
						<div className="mt-3 flex flex-wrap gap-2">
							{editing && (
								<button
									className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
									onClick={() => {
										setEditing(null)
										setForm(initialForm)
									}}
									disabled={saving}
								>
									Cancel
								</button>
							)}
							<button
								className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
								onClick={save}
								disabled={saving || !form.name.trim()}
							>
								{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Activity'}
							</button>
						</div>
						{error && <p className="mt-2 text-sm text-destructive">{error}</p>}
					</div>

					<div className="grid gap-4">
						<div className="rounded border bg-card p-4 shadow-sm">
							<h2 className="text-sm font-semibold">Translate Titles</h2>
							<p className="mt-1 text-xs text-muted-foreground">
								Run this before reprocess so tenders are embedded in English.
							</p>
							<div className="mt-3 grid gap-3">
								<label className="text-xs">
									<span className="font-medium">From date</span>
									<input
										type="date"
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										value={translateRange.fromDate}
										onChange={e => setTranslateRange({ ...translateRange, fromDate: e.target.value })}
									/>
								</label>
								<label className="text-xs">
									<span className="font-medium">To date</span>
									<input
										type="date"
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										value={translateRange.toDate}
										onChange={e => setTranslateRange({ ...translateRange, toDate: e.target.value })}
									/>
								</label>
								<label className="text-xs">
									<span className="font-medium">Portal (optional)</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										placeholder="monaqasat"
										value={translateRange.portal}
										onChange={e => setTranslateRange({ ...translateRange, portal: e.target.value })}
									/>
								</label>
								<label className="text-xs">
									<span className="font-medium">Limit</span>
									<input
										type="number"
										min="1"
										max="1000"
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										value={translateRange.limit}
										onChange={e => setTranslateRange({ ...translateRange, limit: e.target.value })}
									/>
								</label>
								<label className="flex items-center gap-2 text-xs">
									<input
										type="checkbox"
										checked={translateRange.dryRun}
										onChange={e => setTranslateRange({ ...translateRange, dryRun: e.target.checked })}
									/>
									<span className="font-medium">Dry run</span>
								</label>
								<button
									className="rounded bg-secondary px-3 py-2 text-sm text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
									onClick={runTranslate}
									disabled={translating}
								>
									{translating ? 'Translating...' : 'Translate Titles'}
								</button>
								{translateMessage && <p className="text-xs text-muted-foreground">{translateMessage}</p>}
							</div>
						</div>

						<div className="rounded border bg-card p-4 shadow-sm">
							<h2 className="text-sm font-semibold">Reprocess</h2>
							<p className="mt-1 text-xs text-muted-foreground">
								Run after translation or activity updates to refresh embeddings and classifications.
							</p>
							<div className="mt-3 grid gap-3">
								<label className="text-xs">
									<span className="font-medium">From date</span>
									<input
										type="date"
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										value={reprocessRange.fromDate}
										onChange={e => setReprocessRange({ ...reprocessRange, fromDate: e.target.value })}
									/>
								</label>
								<label className="text-xs">
									<span className="font-medium">To date</span>
									<input
										type="date"
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										value={reprocessRange.toDate}
										onChange={e => setReprocessRange({ ...reprocessRange, toDate: e.target.value })}
									/>
								</label>
								<label className="text-xs">
									<span className="font-medium">Portal (optional)</span>
									<input
										className="mt-1 w-full rounded border px-3 py-2 text-sm"
										placeholder="monaqasat"
										value={reprocessRange.portal}
										onChange={e => setReprocessRange({ ...reprocessRange, portal: e.target.value })}
									/>
								</label>
								<button
									className="rounded bg-secondary px-3 py-2 text-sm text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
									onClick={runReprocess}
									disabled={reprocessing}
								>
									{reprocessing ? 'Reprocessing...' : 'Run Reprocess'}
								</button>
								{reprocessMessage && <p className="text-xs text-muted-foreground">{reprocessMessage}</p>}
							</div>
							<div className="mt-4 rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
								<div>Total activities: {totals.total}</div>
								<div>Active: {totals.active}</div>
								<div>High priority: {totals.highPriority}</div>
							</div>
						</div>
					</div>
				</div>

				{loading ? (
					<p className="mt-4 text-sm text-muted-foreground">Loading...</p>
				) : rows.length === 0 ? (
					<p className="mt-4 text-sm text-muted-foreground">No activities configured.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-card shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-muted">
								<tr>
									<th className="px-3 py-2 text-left">Name</th>
									<th className="px-3 py-2 text-left">Scope</th>
									<th className="px-3 py-2 text-left">Keywords</th>
									<th className="px-3 py-2 text-left">Active</th>
									<th className="px-3 py-2 text-left">Priority</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{rows.map(activity => (
									<tr key={activity.id} className="border-t">
										<td className="px-3 py-2 font-medium">{activity.name}</td>
										<td className="px-3 py-2 text-muted-foreground">{activity.scope}</td>
										<td className="px-3 py-2 text-muted-foreground">
											{activity.keywords.length} keywords / {activity.negativeKeywords.length} negative
										</td>
										<td className="px-3 py-2">{activity.isActive ? 'Yes' : 'No'}</td>
										<td className="px-3 py-2">{activity.isHighPriority ? 'Yes' : 'No'}</td>
										<td className="px-3 py-2 text-right">
											<button
												className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
												onClick={() => startEdit(activity)}
											>
												Edit
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
