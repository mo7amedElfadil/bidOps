import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Opportunity } from '../../api/client'
import { SlaBadge } from '../../components/SlaBadge'
import { Page } from '../../components/Page'

export default function List() {
	const qc = useQueryClient()
	const nav = useNavigate()
	const [filters, setFilters] = useState({ q: '', stage: '', client: '' })
	const [showCreate, setShowCreate] = useState(false)
	const [form, setForm] = useState({ title: '', clientId: '', submissionDate: '' })

	const opportunities = useQuery({
		queryKey: ['opportunities'],
		queryFn: () => api.listOpportunities()
	})
	const clients = useQuery({ queryKey: ['clients'], queryFn: api.listClients })

	const createMutation = useMutation({
		mutationFn: () => api.createOpportunity(form),
		onSuccess: data => {
			setShowCreate(false)
			setForm({ title: '', clientId: '', submissionDate: '' })
			qc.invalidateQueries({ queryKey: ['opportunities'] })
			nav(`/opportunity/${data.id}`)
		}
	})

	const filtered: Opportunity[] = useMemo(() => {
		const list = opportunities.data || []
		const q = filters.q.toLowerCase()
		return list.filter(o => {
			const matchesQ = !q || o.title.toLowerCase().includes(q) || (o.clientId || '').toLowerCase().includes(q)
			const matchesStage = !filters.stage || (o.stage || '').toLowerCase() === filters.stage.toLowerCase()
			const matchesClient = !filters.client || o.clientId === filters.client
			return matchesQ && matchesStage && matchesClient
		})
	}, [filters, opportunities.data])

	return (
		<Page
			title="Opportunities"
			subtitle="List, filter, and drill into opportunities. SLA badges reflect submission proximity."
			actions={
				<div className="flex gap-2">
					<a href={`${import.meta.env.VITE_API_URL}/analytics/export/opportunities.csv`} download className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 flex items-center">Export CSV</a>
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
					onChange={e => setFilters({ ...filters, q: e.target.value })}
				/>
				<input
					className="rounded border px-3 py-2"
					placeholder="Stage (e.g. Submission)"
					value={filters.stage}
					onChange={e => setFilters({ ...filters, stage: e.target.value })}
				/>
				<select
					className="rounded border px-3 py-2"
					value={filters.client}
					onChange={e => setFilters({ ...filters, client: e.target.value })}
				>
					<option value="">All clients</option>
					{clients.data?.map(c => (
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
							<th className="px-3 py-2 text-left">Status</th>
							<th className="px-3 py-2 text-left">Stage</th>
							<th className="px-3 py-2 text-left">Due</th>
							<th className="px-3 py-2 text-left">SLA</th>
							<th className="px-3 py-2 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map(o => (
							<tr key={o.id} className="border-t hover:bg-slate-50">
								<td className="px-3 py-2 font-medium">
									<Link to={`/opportunity/${o.id}`} className="hover:underline">
										{o.title}
									</Link>
								</td>
								<td className="px-3 py-2">{o.clientId || '-'}</td>
								<td className="px-3 py-2">{o.status || '-'}</td>
								<td className="px-3 py-2">{o.stage || '-'}</td>
								<td className="px-3 py-2">
									{o.submissionDate ? o.submissionDate.slice(0, 10) : '-'}
								</td>
								<td className="px-3 py-2">
									<SlaBadge daysLeft={o.daysLeft} />
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
						{filtered.length === 0 && !opportunities.isLoading && (
							<tr>
								<td colSpan={7} className="px-3 py-4 text-center text-slate-500">
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
								<select
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.clientId}
									onChange={e => setForm({ ...form, clientId: e.target.value })}
								>
									<option value="">Select client</option>
									{clients.data?.map(c => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</label>
							<label className="text-sm">
								<span className="font-medium">Submission date</span>
								<input
									type="date"
									className="mt-1 w-full rounded border px-3 py-2"
									value={form.submissionDate}
									onChange={e => setForm({ ...form, submissionDate: e.target.value })}
								/>
							</label>
						</div>
						<div className="mt-4 flex justify-end gap-2">
					<a href={`${import.meta.env.VITE_API_URL}/analytics/export/opportunities.csv`} download className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 flex items-center">Export CSV</a>
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
								onClick={() => setShowCreate(false)}
								disabled={createMutation.isPending}
							>
								Cancel
							</button>
					<a href={`${import.meta.env.VITE_API_URL}/analytics/export/opportunities.csv`} download className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 flex items-center">Export CSV</a>
							<button
								className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
								onClick={() => createMutation.mutate()}
								disabled={!form.title || !form.clientId || createMutation.isPending}
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
