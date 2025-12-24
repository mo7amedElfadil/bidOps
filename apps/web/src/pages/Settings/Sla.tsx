import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Page } from '../../components/Page'
import { DEFAULT_STAGE_LIST, DEFAULT_STATUS_LIST } from '../../constants/opportunity-lists'

export default function SlaSettingsPage() {
	const slaQuery = useQuery({ queryKey: ['sla'], queryFn: api.getSlaSettings })
	const holidaysQuery = useQuery({ queryKey: ['sla-holidays'], queryFn: api.getHolidaySettings })
	const retentionQuery = useQuery({ queryKey: ['retention'], queryFn: api.getRetentionPolicy })
	const timezoneQuery = useQuery({ queryKey: ['timezone'], queryFn: api.getTimezoneSettings })
	const importDateQuery = useQuery({ queryKey: ['import-date-format'], queryFn: api.getImportDateFormat })
	const fxQuery = useQuery({ queryKey: ['fx-rates'], queryFn: api.listFxRates })
	const [form, setForm] = useState({ warnDays: 7, alertDays: 3, urgentDays: 1 })
	const [holidayText, setHolidayText] = useState('')
	const [retentionYears, setRetentionYears] = useState(5)
	const [offsetHours, setOffsetHours] = useState(3)
	const [importDateFormat, setImportDateFormat] = useState<'MDY' | 'DMY' | 'AUTO'>('MDY')
	const stageListQuery = useQuery({ queryKey: ['opportunity-stages'], queryFn: api.getOpportunityStages })
	const statusListQuery = useQuery({ queryKey: ['opportunity-statuses'], queryFn: api.getOpportunityStatuses })
	const [stageInput, setStageInput] = useState('')
	const [statusInput, setStatusInput] = useState('')
	const [newFx, setNewFx] = useState({ currency: '', rateToQar: '' })

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

	useEffect(() => {
		if (timezoneQuery.data) setOffsetHours(timezoneQuery.data.offsetHours)
	}, [timezoneQuery.data])

	useEffect(() => {
		if (importDateQuery.data) setImportDateFormat(importDateQuery.data.format)
	}, [importDateQuery.data])

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

	const timezoneMutation = useMutation({
		mutationFn: () => api.setTimezoneSettings({ offsetHours }),
		onSuccess: data => setOffsetHours(data.offsetHours)
	})

	const importDateMutation = useMutation({
		mutationFn: () => api.setImportDateFormat({ format: importDateFormat }),
		onSuccess: data => setImportDateFormat(data.format)
	})

	const stageMutation = useMutation({
		mutationFn: (stages: string[]) => api.setOpportunityStages({ stages }),
		onSuccess: () => stageListQuery.refetch()
	})

	const statusMutation = useMutation({
		mutationFn: (statuses: string[]) => api.setOpportunityStatuses({ statuses }),
		onSuccess: () => statusListQuery.refetch()
	})

	const stageList = stageListQuery.data?.stages ?? DEFAULT_STAGE_LIST
	const statusList = statusListQuery.data?.statuses ?? DEFAULT_STATUS_LIST

	const addStage = () => {
		const trimmed = stageInput.trim()
		if (!trimmed) return
		if (stageList.includes(trimmed)) {
			setStageInput('')
			return
		}
		stageMutation.mutate([...stageList, trimmed])
		setStageInput('')
	}

	const removeStage = (value: string) => {
		if (stageList.length <= 1) return
		stageMutation.mutate(stageList.filter(stage => stage !== value))
	}

	const addStatus = () => {
		const trimmed = statusInput.trim()
		if (!trimmed) return
		if (statusList.includes(trimmed)) {
			setStatusInput('')
			return
		}
		statusMutation.mutate([...statusList, trimmed])
		setStatusInput('')
	}

	const removeStatus = (value: string) => {
		if (statusList.length <= 1) return
		statusMutation.mutate(statusList.filter(status => status !== value))
	}

	const reorderStages = (index: number, direction: -1 | 1) => {
		const target = index + direction
		if (target < 0 || target >= stageList.length) return
		const copied = [...stageList]
		const temp = copied[target]
		copied[target] = copied[index]
		copied[index] = temp
		stageMutation.mutate(copied)
	}

	const reorderStatuses = (index: number, direction: -1 | 1) => {
		const target = index + direction
		if (target < 0 || target >= statusList.length) return
		const copied = [...statusList]
		const temp = copied[target]
		copied[target] = copied[index]
		copied[index] = temp
		statusMutation.mutate(copied)
	}

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
			title="Settings"
			subtitle="Configure SLA thresholds, lifecycle lists, and operational defaults."
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
			<div className="mt-2">
				<h2 className="text-sm font-semibold text-slate-700">SLA configuration</h2>
				<p className="text-xs text-slate-500">Thresholds and holidays that drive SLA badges and reminders.</p>
			</div>

			<div className="mt-3 rounded border bg-white p-4 shadow-sm">
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

			<div className="mt-8">
				<h2 className="text-sm font-semibold text-slate-700">Opportunity lifecycle lists</h2>
				<p className="text-xs text-slate-500">Stages and statuses used across opportunity records.</p>
			</div>

			<div className="mt-3 rounded border bg-white p-4 shadow-sm">
				<h3 className="text-sm font-semibold">Opportunity stages</h3>
				<p className="mt-2 text-xs text-slate-600">
					Define the dropdown values you'll use when moving opportunities through the lifecycle.
				</p>
				<div className="mt-3 space-y-2">
					{stageList.map((stage, index) => (
						<div
							key={stage}
							className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
						>
							<div className="font-medium">{stage}</div>
							<div className="flex gap-1">
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStages(index, -1)}
									disabled={stageMutation.isPending || index === 0}
								>
									▲
								</button>
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStages(index, 1)}
									disabled={stageMutation.isPending || index === stageList.length - 1}
								>
									▼
								</button>
								<button
									type="button"
									className="text-xs text-red-500 hover:text-red-700"
									onClick={() => removeStage(stage)}
									disabled={stageMutation.isPending || stageList.length <= 1}
								>
									×
								</button>
							</div>
						</div>
					))}
				</div>
				<div className="mt-3 flex gap-2">
					<input
						className="w-full rounded border px-3 py-2 text-sm"
						placeholder="Add stage"
						value={stageInput}
						onChange={e => setStageInput(e.target.value)}
					/>
					<button
						className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						onClick={addStage}
						disabled={!stageInput.trim() || stageMutation.isPending}
					>
						Add
					</button>
				</div>
				{stageMutation.isError && (
					<p className="mt-2 text-xs text-red-600">Failed to save stages. Try again.</p>
				)}
			</div>

			<div className="mt-6 rounded border bg-white p-4 shadow-sm">
				<h3 className="text-sm font-semibold">Opportunity statuses</h3>
				<p className="mt-2 text-xs text-slate-600">Statuses show in the dropdown while editing opportunities.</p>
				<div className="mt-3 space-y-2">
					{statusList.map((status, index) => (
						<div
							key={status}
							className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
						>
							<div className="font-medium">{status}</div>
							<div className="flex gap-1">
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStatuses(index, -1)}
									disabled={statusMutation.isPending || index === 0}
								>
									▲
								</button>
								<button
									type="button"
									className="rounded border border-slate-300 px-1 text-xs hover:bg-slate-100 disabled:text-slate-300"
									onClick={() => reorderStatuses(index, 1)}
									disabled={statusMutation.isPending || index === statusList.length - 1}
								>
									▼
								</button>
								<button
									type="button"
									className="text-xs text-red-500 hover:text-red-700"
									onClick={() => removeStatus(status)}
									disabled={statusMutation.isPending || statusList.length <= 1}
								>
									×
								</button>
							</div>
						</div>
					))}
				</div>
				<div className="mt-3 flex gap-2">
					<input
						className="w-full rounded border px-3 py-2 text-sm"
						placeholder="Add status"
						value={statusInput}
						onChange={e => setStatusInput(e.target.value)}
					/>
					<button
						className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						onClick={addStatus}
						disabled={!statusInput.trim() || statusMutation.isPending}
					>
						Add
					</button>
				</div>
				{statusMutation.isError && (
					<p className="mt-2 text-xs text-red-600">Failed to save statuses. Try again.</p>
				)}
			</div>

			<div className="mt-8">
				<h2 className="text-sm font-semibold text-slate-700">General settings</h2>
				<p className="text-xs text-slate-500">System defaults used across import, storage, and pricing.</p>
			</div>

			<div className="mt-3 rounded border bg-white p-4 shadow-sm">
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

			<div className="mt-6 rounded border bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">Timezone Offset</h3>
					<button
						className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300 disabled:opacity-50"
						onClick={() => timezoneMutation.mutate()}
						disabled={timezoneMutation.isPending}
					>
						{timezoneMutation.isPending ? 'Saving...' : 'Save'}
					</button>
				</div>
				<p className="mt-2 text-xs text-slate-600">
					Default is UTC+3 (Qatar). Update the offset hours if your operating timezone changes.
				</p>
				<input
					type="number"
					className="mt-3 w-full rounded border px-3 py-2 text-sm"
					value={offsetHours}
					onChange={e => setOffsetHours(Number(e.target.value))}
				/>
				{timezoneMutation.error && (
					<p className="mt-3 text-sm text-red-600">
						Failed to save: {(timezoneMutation.error as Error).message}
					</p>
				)}
				{timezoneMutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-slate-600">
					API: GET/PUT /settings/timezone (role: ADMIN to edit).
				</p>
			</div>

			<div className="mt-6 rounded border bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">Import Date Format</h3>
					<button
						className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300 disabled:opacity-50"
						onClick={() => importDateMutation.mutate()}
						disabled={importDateMutation.isPending}
					>
						{importDateMutation.isPending ? 'Saving...' : 'Save'}
					</button>
				</div>
				<p className="mt-2 text-xs text-slate-600">
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
					<p className="mt-3 text-sm text-red-600">
						Failed to save: {(importDateMutation.error as Error).message}
					</p>
				)}
				{importDateMutation.isSuccess && <p className="mt-3 text-sm text-green-700">Saved.</p>}
				<p className="mt-3 text-xs text-slate-600">
					API: GET/PUT /settings/import-date-format (role: ADMIN to edit).
				</p>
			</div>

			<div className="mt-6 rounded border bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold">FX Rates (Base QAR)</h3>
					<button
						className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300 disabled:opacity-50"
						onClick={() => fxUpsert.mutate()}
						disabled={fxUpsert.isPending || !newFx.currency || !newFx.rateToQar}
					>
						{fxUpsert.isPending ? 'Saving...' : 'Add/Update'}
					</button>
				</div>
				<p className="mt-2 text-xs text-slate-600">
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
						<thead className="bg-slate-100">
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
											className="text-xs text-red-600 hover:underline"
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
									<td colSpan={3} className="px-3 py-3 text-center text-slate-500">
										No FX rates configured.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				{(fxUpsert.error || fxUpdate.error || fxDelete.error) && (
					<p className="mt-3 text-sm text-red-600">
						Failed to update FX rates. Check your inputs and try again.
					</p>
				)}
				<p className="mt-3 text-xs text-slate-600">
					API: GET/POST/PATCH/DELETE /settings/fx-rates (role: ADMIN to edit).
				</p>
			</div>
		</Page>
	)
}
