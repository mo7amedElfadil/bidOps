import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Opportunity } from '../../api/client'
import { Page } from '../../components/Page'
import CountdownRing from '../../components/CountdownRing'
import { downloadWithAuth } from '../../utils/download'

function toIsoWithOffset(value: string, offsetHours: number) {
	const [datePart, timePart = '00:00'] = value.split('T')
	const [year, month, day] = datePart.split('-').map(Number)
	const [hour, minute] = timePart.split(':').map(Number)
	const utc = Date.UTC(year, month - 1, day, hour - offsetHours, minute)
	return new Date(utc).toISOString()
}

function formatWithOffset(value: string, offsetHours: number) {
	const date = new Date(value)
	const shifted = new Date(date.getTime() + offsetHours * 60 * 60 * 1000)
	const yyyy = shifted.getUTCFullYear()
	const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
	const dd = String(shifted.getUTCDate()).padStart(2, '0')
	const hh = String(shifted.getUTCHours()).padStart(2, '0')
	const min = String(shifted.getUTCMinutes()).padStart(2, '0')
	const sign = offsetHours >= 0 ? '+' : ''
	return `${yyyy}-${mm}-${dd} ${hh}:${min} (UTC${sign}${offsetHours})`
}

export default function List() {
	const qc = useQueryClient()
	const nav = useNavigate()
	const [filters, setFilters] = useState({ q: '', stage: '', client: '' })
	const [showCreate, setShowCreate] = useState(false)
	const [form, setForm] = useState({
		title: '',
		clientInput: '',
		submissionDate: '',
		modeOfSubmission: 'Monaqasat',
		sourcePortal: 'Monaqasat'
	})
	const [page, setPage] = useState(1)
	const [pageSize] = useState(25)
	const [pageInput, setPageInput] = useState('1')
	const [now, setNow] = useState(Date.now())
	const timezoneQuery = useQuery({ queryKey: ['timezone'], queryFn: api.getTimezoneSettings })

	const opportunities = useQuery({
		queryKey: ['opportunities', page, pageSize, filters.stage, filters.client, filters.q],
		queryFn: () =>
			api.listOpportunities({
				page,
				pageSize,
				stage: filters.stage || undefined,
				clientId: filters.client || undefined,
				q: filters.q || undefined
			})
	})
	const clients = useQuery({
		queryKey: ['clients'],
		queryFn: () => api.listClients({ page: 1, pageSize: 500 })
	})

	const createMutation = useMutation({
		mutationFn: () => {
			const name = form.clientInput.trim()
			const match = clients.data?.items?.find(c => c.name.toLowerCase() === name.toLowerCase())
			const offsetHours = timezoneQuery.data?.offsetHours ?? 3
			const submissionDate = form.submissionDate
				? toIsoWithOffset(form.submissionDate, offsetHours)
				: undefined
			return api.createOpportunity({
				title: form.title,
				submissionDate,
				modeOfSubmission: form.modeOfSubmission || undefined,
				sourcePortal: form.sourcePortal || undefined,
				clientId: match?.id,
				clientName: match ? undefined : name
			})
		},
		onSuccess: data => {
			setShowCreate(false)
			setForm({
				title: '',
				clientInput: '',
				submissionDate: '',
				modeOfSubmission: 'Monaqasat',
				sourcePortal: 'Monaqasat'
			})
			qc.invalidateQueries({ queryKey: ['opportunities'] })
			nav(`/opportunity/${data.id}`)
		}
	})

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 60000)
		return () => clearInterval(timer)
	}, [])
	useEffect(() => {
		if (opportunities.data?.page) {
			setPageInput(String(opportunities.data.page))
		}
	}, [opportunities.data?.page])
	const rows = opportunities.data?.items || []

	return (
		<Page
			title="Opportunities"
			subtitle="List, filter, and drill into opportunities. SLA badges reflect submission proximity."
			actions={
				<div className="flex gap-2">
					<button
						className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 flex items-center"
						onClick={() =>
							downloadWithAuth(
								`${import.meta.env.VITE_API_URL}/analytics/export/opportunities.csv`,
								`opportunities.csv`
							)
						}
					>
						Export CSV
					</button>
					<button
						className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
						onClick={() => setShowCreate(true)}
					>
						+ New
					</button>
					<Link
						to="/import/tracker"
						className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
					>
						Import Tracker
					</Link>
				</div>
			}
		>
			<div className="mt-4 flex flex-wrap gap-3 text-sm">
				<input
					className="rounded border px-3 py-2"
					placeholder="Search title or client"
					value={filters.q}
					onChange={e => {
						setFilters({ ...filters, q: e.target.value })
						setPage(1)
					}}
				/>
				<input
					className="rounded border px-3 py-2"
					placeholder="Stage (e.g. Submission)"
					value={filters.stage}
					onChange={e => {
						setFilters({ ...filters, stage: e.target.value })
						setPage(1)
					}}
				/>
				<select
					className="rounded border px-3 py-2"
					value={filters.client}
					onChange={e => {
						setFilters({ ...filters, client: e.target.value })
						setPage(1)
					}}
				>
					<option value="">All clients</option>
					{clients.data?.items?.map(c => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</select>
				<Link to="/board" className="rounded bg-slate-100 px-3 py-2 hover:bg-slate-200">
					Kanban
				</Link>
				<Link to="/timeline" className="rounded bg-slate-100 px-3 py-2 hover:bg-slate-200">
					Timeline
				</Link>
				<Link to="/awards/staging" className="rounded bg-slate-100 px-3 py-2 hover:bg-slate-200">
					Awards
				</Link>
			</div>

			{opportunities.isLoading && <p className="mt-4 text-sm text-slate-600">Loading...</p>}
			{opportunities.error && (
				<p className="mt-4 text-sm text-red-600">
					{(opportunities.error as Error).message || 'Failed to load opportunities'}
				</p>
			)}

			<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
				<table className="min-w-full text-sm">
					<thead className="bg-slate-100">
						<tr>
							<th className="px-3 py-2 text-left">Title</th>
							<th className="px-3 py-2 text-left">Client</th>
							<th className="px-3 py-2 text-left">Business Owner</th>
							<th className="px-3 py-2 text-left">Bid Owners</th>
							<th className="px-3 py-2 text-left">Status</th>
    <th className="px-3 py-2 text-left">Stage</th>
    <th className="px-3 py-2 text-left">Start</th>
    <th className="px-3 py-2 text-left">Due</th>
							<th className="px-3 py-2 text-left">SLA</th>
							<th className="px-3 py-2 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(o => (
							<tr key={o.id} className="border-t hover:bg-slate-50">
								<td className="px-3 py-2 font-medium">
									<Link to={`/opportunity/${o.id}`} className="hover:underline">
										{o.title}
									</Link>
								</td>
								<td className="px-3 py-2">{o.clientName || o.clientId || '-'}</td>
								<td className="px-3 py-2">{o.dataOwner || '-'}</td>
								<td className="px-3 py-2">
									{o.bidOwners?.length
										? o.bidOwners.map(owner => owner.name || owner.email || owner.id).join(', ')
										: '-'}
								</td>
								<td className="px-3 py-2">{o.status || '-'}</td>
							<td className="px-3 py-2">{o.stage || '-'}</td>
							<td className="px-3 py-2">
								{o.startDate
									? formatWithOffset(o.startDate, timezoneQuery.data?.offsetHours ?? 3)
									: '-'}
							</td>
							<td className="px-3 py-2">
									{o.submissionDate
										? formatWithOffset(o.submissionDate, timezoneQuery.data?.offsetHours ?? 3)
										: '-'}
								</td>
								<td className="px-3 py-2">
									<CountdownRing submissionDate={o.submissionDate} now={now} />
								</td>
								<td className="px-3 py-2">
									<div className="flex flex-wrap gap-1">
										<Link
											to={`/opportunity/${o.id}/attachments`}
											className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200"
										>
											Docs
										</Link>
										<Link
											to={`/opportunity/${o.id}/compliance`}
											className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200"
										>
											Compliance
										</Link>
										<Link
											to={`/opportunity/${o.id}/clarifications`}
											className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200"
										>
											Q&A
										</Link>
										<Link
											to={`/opportunity/${o.id}/pricing`}
											className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200"
										>
											Pricing
										</Link>
										<Link
											to={`/opportunity/${o.id}/approvals`}
											className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200"
										>
											Approvals
										</Link>
										<Link
											to={`/opportunity/${o.id}/submission`}
											className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200"
										>
											Submit
										</Link>
										<Link
											to={`/opportunity/${o.id}/outcome`}
											className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-slate-200"
										>
											Outcome
										</Link>
									</div>
								</td>
							</tr>
						))}
						{rows.length === 0 && !opportunities.isLoading && (
							<tr>
								<td colSpan={9} className="px-3 py-4 text-center text-slate-500">
									No opportunities yet.{' '}
									<Link to="/import/tracker" className="text-blue-600 hover:underline">
										Import your tracker
									</Link>{' '}
									or create a new record.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			{opportunities.data && (
				<div className="mt-4 flex items-center justify-between text-sm text-slate-600">
					<span>
						Page {opportunities.data.page} of {Math.max(1, Math.ceil(opportunities.data.total / opportunities.data.pageSize))}
					</span>
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-2">
							<span className="text-xs text-slate-500">Go to</span>
							<input
								type="number"
								min={1}
								max={Math.max(1, Math.ceil(opportunities.data.total / opportunities.data.pageSize))}
								className="w-20 rounded border px-2 py-1 text-sm"
								value={pageInput}
								onChange={e => setPageInput(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										const maxPage = Math.max(1, Math.ceil(opportunities.data.total / opportunities.data.pageSize))
										const nextPage = Math.min(maxPage, Math.max(1, Number(pageInput || 1)))
										setPage(nextPage)
									}
								}}
							/>
							<button
								className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 disabled:opacity-50"
								onClick={() => {
									const maxPage = Math.max(1, Math.ceil(opportunities.data.total / opportunities.data.pageSize))
									const nextPage = Math.min(maxPage, Math.max(1, Number(pageInput || 1)))
									setPage(nextPage)
								}}
								disabled={opportunities.isLoading}
							>
								Go
							</button>
						</div>
						<button
							className="rounded bg-slate-100 px-3 py-1.5 hover:bg-slate-200 disabled:opacity-50"
							onClick={() => setPage(p => Math.max(1, p - 1))}
							disabled={opportunities.data.page <= 1}
						>
							Prev
						</button>
						<button
							className="rounded bg-slate-100 px-3 py-1.5 hover:bg-slate-200 disabled:opacity-50"
							onClick={() =>
								setPage(p =>
									p < Math.ceil(opportunities.data.total / opportunities.data.pageSize) ? p + 1 : p
								)
							}
							disabled={
								opportunities.data.page >=
								Math.ceil(opportunities.data.total / opportunities.data.pageSize)
							}
						>
							Next
						</button>
					</div>
				</div>
			)}

			{showCreate && (
				<div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
					<div className="w-full max-w-lg rounded border bg-white p-5 shadow-lg">
						<h2 className="text-lg font-semibold">Create Opportunity</h2>
						<div className="mt-3 grid gap-3">
							<label className="text-sm">
								<span className="font-medium">Title</span>
								<input
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.title}
									onChange={e => setForm({ ...form, title: e.target.value })}
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Client</span>
								<input
									list="client-options"
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.clientInput}
									onChange={e => setForm({ ...form, clientInput: e.target.value })}
									placeholder="Select or type a client"
								/>
								<datalist id="client-options">
									{clients.data?.items?.map(c => (
										<option key={c.id} value={c.name} />
									))}
								</datalist>
							</label>
							<label className="text-sm">
								<span className="font-medium">Submission date & time</span>
								<input
									type="datetime-local"
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.submissionDate}
									onChange={e => setForm({ ...form, submissionDate: e.target.value })}
								/>
							</label>
							<label className="text-sm">
								<span className="font-medium">Method of submission</span>
								<input
									list="submission-methods"
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.modeOfSubmission}
									onChange={e => setForm({ ...form, modeOfSubmission: e.target.value })}
									placeholder="Monaqasat"
								/>
								<datalist id="submission-methods">
									<option value="Monaqasat" />
									<option value="Portal" />
									<option value="Email" />
									<option value="Hand Delivery" />
								</datalist>
							</label>
							<label className="text-sm">
								<span className="font-medium">Source</span>
								<input
									list="opportunity-sources"
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.sourcePortal}
									onChange={e => setForm({ ...form, sourcePortal: e.target.value })}
									placeholder="Monaqasat"
								/>
								<datalist id="opportunity-sources">
									<option value="Monaqasat" />
									<option value="Referral" />
									<option value="Email" />
									<option value="Direct" />
								</datalist>
							</label>
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
								onClick={() => setShowCreate(false)}
								disabled={createMutation.isPending}
							>
								Cancel
							</button>
							<button
								className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
								onClick={() => createMutation.mutate()}
								disabled={!form.title || !form.clientInput.trim() || createMutation.isPending}
							>
								{createMutation.isPending ? 'Creating...' : 'Create'}
							</button>
						</div>
						{createMutation.error && (
							<p className="mt-2 text-sm text-red-600">
								{(createMutation.error as Error).message || 'Failed to create'}
							</p>
						)}
					</div>
				</div>
			)}
		</Page>
	)
}
