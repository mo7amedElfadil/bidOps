import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Page } from '../../components/Page'
import SettingsNav from '../../components/SettingsNav'

export default function SystemSettingsPage() {
	const retentionQuery = useQuery({ queryKey: ['retention'], queryFn: api.getRetentionPolicy })
	const timezoneQuery = useQuery({ queryKey: ['timezone'], queryFn: api.getTimezoneSettings })
	const importDateQuery = useQuery({ queryKey: ['import-date-format'], queryFn: api.getImportDateFormat })
	const fxQuery = useQuery({ queryKey: ['fx-rates'], queryFn: api.listFxRates })
	const [retentionYears, setRetentionYears] = useState(5)
	const [offsetHours, setOffsetHours] = useState(3)
	const [importDateFormat, setImportDateFormat] = useState<'MDY' | 'DMY' | 'AUTO'>('MDY')
	const [newFx, setNewFx] = useState({ currency: '', rateToQar: '' })

	useEffect(() => {
		if (retentionQuery.data) setRetentionYears(retentionQuery.data.years)
	}, [retentionQuery.data])

	useEffect(() => {
		if (timezoneQuery.data) setOffsetHours(timezoneQuery.data.offsetHours)
	}, [timezoneQuery.data])

	useEffect(() => {
		if (importDateQuery.data) setImportDateFormat(importDateQuery.data.format)
	}, [importDateQuery.data])

	const retentionMutation = useMutation({
		mutationFn: () => api.setRetentionPolicy({ years: retentionYears }),
		onSuccess: data => setRetentionYears(data.years)
	})

	const timezoneMutation = useMutation({
		mutationFn: () => api.setTimezoneSettings({ offsetHours }),
		onSuccess: data => setOffsetHours(data.offsetHours)
	})

	const importDateMutation = useMutation({
		mutationFn: () => api.setImportDateFormat({ format: importDateFormat }),
		onSuccess: data => setImportDateFormat(data.format)
	})

	const fxUpsert = useMutation({
		mutationFn: () => api.upsertFxRate({ currency: newFx.currency, rateToQar: Number(newFx.rateToQar) }),
		onSuccess: () => {
			setNewFx({ currency: '', rateToQar: '' })
			fxQuery.refetch()
		}
	})

	const fxUpdate = useMutation({
		mutationFn: ({ id, rateToQar }: { id: string; rateToQar: number }) => api.updateFxRate(id, { rateToQar }),
		onSuccess: () => fxQuery.refetch()
	})

	const fxDelete = useMutation({
		mutationFn: (id: string) => api.deleteFxRate(id),
		onSuccess: () => fxQuery.refetch()
	})

	return (
		<Page
			title="System Settings"
			subtitle="Defaults for data retention, timekeeping, imports, and FX."
		>
			<SettingsNav />

			<div className="mt-4 rounded border bg-card p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">Data Retention</h3>
					<button
						className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80 disabled:opacity-50"
						onClick={() => retentionMutation.mutate()}
						disabled={retentionMutation.isPending}
					>
						{retentionMutation.isPending ? 'Saving...' : 'Save'}
					</button>
				</div>
				<p className="mt-2 text-xs text-muted-foreground">
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
					<p className="mt-3 text-sm text-destructive">
						Failed to save: {(retentionMutation.error as Error).message}
					</p>
				)}
				{retentionMutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-muted-foreground">
					API: GET/PUT /settings/retention (role: ADMIN to edit).
				</p>
			</div>

			<div className="mt-6 rounded border bg-card p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">Timezone Offset</h3>
					<button
						className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80 disabled:opacity-50"
						onClick={() => timezoneMutation.mutate()}
						disabled={timezoneMutation.isPending}
					>
						{timezoneMutation.isPending ? 'Saving...' : 'Save'}
					</button>
				</div>
				<p className="mt-2 text-xs text-muted-foreground">
					Default is UTC+3 (Qatar). Update the offset hours if your operating timezone changes.
				</p>
				<input
					type="number"
					className="mt-3 w-full rounded border px-3 py-2 text-sm"
					value={offsetHours}
					onChange={e => setOffsetHours(Number(e.target.value))}
				/>
				{timezoneMutation.error && (
					<p className="mt-3 text-sm text-destructive">
						Failed to save: {(timezoneMutation.error as Error).message}
					</p>
				)}
				{timezoneMutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-muted-foreground">
					API: GET/PUT /settings/timezone (role: ADMIN to edit).
				</p>
			</div>

			<div className="mt-6 rounded border bg-card p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">Import Date Format</h3>
					<button
						className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80 disabled:opacity-50"
						onClick={() => importDateMutation.mutate()}
						disabled={importDateMutation.isPending}
					>
						{importDateMutation.isPending ? 'Saving...' : 'Save'}
					</button>
				</div>
				<p className="mt-2 text-xs text-muted-foreground">
					Lock how tracker dates are parsed. Use MDY for 11/23/2025 or DMY for 23/11/2025.
				</p>
				<select
					className="mt-3 w-full rounded border px-3 py-2 text-sm"
					value={importDateFormat}
					onChange={e => setImportDateFormat(e.target.value as 'MDY' | 'DMY' | 'AUTO')}
				>
					<option value="MDY">MDY (MM/DD/YYYY)</option>
					<option value="DMY">DMY (DD/MM/YYYY)</option>
					<option value="AUTO">AUTO (best effort)</option>
				</select>
				{importDateMutation.error && (
					<p className="mt-3 text-sm text-destructive">
						Failed to save: {(importDateMutation.error as Error).message}
					</p>
				)}
				{importDateMutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-muted-foreground">
					API: GET/PUT /settings/import-date-format (role: ADMIN to edit).
				</p>
			</div>

			<div className="mt-6 rounded border bg-card p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">FX Rates (Base QAR)</h3>
					<button
						className="rounded bg-muted px-3 py-1.5 text-sm hover:bg-muted/80 disabled:opacity-50"
						onClick={() => fxUpsert.mutate()}
						disabled={fxUpsert.isPending || !newFx.currency || !newFx.rateToQar}
					>
						{fxUpsert.isPending ? 'Saving...' : 'Add/Update'}
					</button>
				</div>
				<p className="mt-2 text-xs text-muted-foreground">
					Add latest conversion rates to QAR. These drive live pricing conversions.
				</p>
				<div className="mt-3 grid gap-3 sm:grid-cols-3">
					<label className="text-sm">
						<span className="font-medium">Currency</span>
						<input
							className="mt-1 w-full rounded border px-3 py-2 text-sm uppercase"
							value={newFx.currency}
							onChange={e => setNewFx({ ...newFx, currency: e.target.value.toUpperCase() })}
							placeholder="USD"
						/>
					</label>
					<label className="text-sm">
						<span className="font-medium">Rate to QAR</span>
						<input
							type="number"
							step="0.0001"
							className="mt-1 w-full rounded border px-3 py-2 text-sm"
							value={newFx.rateToQar}
							onChange={e => setNewFx({ ...newFx, rateToQar: e.target.value })}
							placeholder="3.64"
						/>
					</label>
				</div>
				<div className="mt-4 overflow-x-auto rounded border">
					<table className="min-w-full text-sm">
						<thead className="bg-muted">
							<tr>
								<th className="px-3 py-2 text-left">Currency</th>
								<th className="px-3 py-2 text-left">Rate to QAR</th>
								<th className="px-3 py-2 text-left"></th>
							</tr>
						</thead>
						<tbody>
							{fxQuery.data?.map(rate => (
								<tr key={rate.id} className="border-t">
									<td className="px-3 py-2 font-medium">{rate.currency}</td>
									<td className="px-3 py-2">
										<input
											type="number"
											step="0.0001"
											className="w-40 rounded border px-2 py-1 text-sm"
											defaultValue={rate.rateToQar}
											onBlur={e => fxUpdate.mutate({ id: rate.id, rateToQar: Number(e.target.value) })}
										/>
									</td>
									<td className="px-3 py-2">
										<button
											className="text-xs text-destructive hover:underline"
											onClick={() => fxDelete.mutate(rate.id)}
											disabled={fxDelete.isPending}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
							{!fxQuery.isLoading && fxQuery.data?.length === 0 && (
								<tr>
									<td colSpan={3} className="px-3 py-3 text-center text-muted-foreground">
										No FX rates configured.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				{(fxUpsert.error || fxUpdate.error || fxDelete.error) && (
					<p className="mt-3 text-sm text-destructive">
						Failed to update FX rates. Check your inputs and try again.
					</p>
				)}
				<p className="mt-3 text-xs text-muted-foreground">
					API: GET/POST/PATCH/DELETE /settings/fx-rates (role: ADMIN to edit).
				</p>
			</div>
		</Page>
	)
}
