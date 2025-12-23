import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, Opportunity } from '../../api/client'
import { SlaBadge } from '../../components/SlaBadge'
import { Page } from '../../components/Page'

export default function Timeline() {
	const opsQuery = useQuery({
		queryKey: ['opportunities', 'timeline'],
		queryFn: () => api.listOpportunities({ page: 1, pageSize: 200 })
	})
	const slaQuery = useQuery({ queryKey: ['sla'], queryFn: api.getSlaSettings })

	const ops = (opsQuery.data?.items || []).slice().sort((a: Opportunity, b: Opportunity) => {
		const da = a.submissionDate ? new Date(a.submissionDate).getTime() : Infinity
		const db = b.submissionDate ? new Date(b.submissionDate).getTime() : Infinity
		return da - db
	})

	return (
		<Page
			title="Timeline"
			subtitle="Ordered by submission date with SLA thresholds."
			actions={
				<div className="flex gap-2">
					<Link to="/" className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">
						List
					</Link>
					<Link to="/board" className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">
						Kanban
					</Link>
				</div>
			}
		>
			{slaQuery.data && (
				<div className="rounded border bg-white p-3 text-sm text-slate-700">
					SLA thresholds: warn ≤ {slaQuery.data.warnDays}d, alert ≤ {slaQuery.data.alertDays}d, urgent ≤{' '}
					{slaQuery.data.urgentDays}d.
				</div>
			)}

			{opsQuery.error && (
				<p className="mt-4 text-sm text-red-600">
					{(opsQuery.error as Error).message || 'Failed to load timeline'}
				</p>
			)}
			{opsQuery.isLoading ? (
				<p className="mt-4 text-sm text-slate-600">Loading...</p>
			) : (
				<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-100">
							<tr>
								<th className="px-3 py-2 text-left">Submission</th>
								<th className="px-3 py-2 text-left">Title</th>
								<th className="px-3 py-2 text-left">Client</th>
								<th className="px-3 py-2 text-left">Stage</th>
								<th className="px-3 py-2 text-left">Status</th>
								<th className="px-3 py-2 text-left">SLA</th>
							</tr>
						</thead>
						<tbody>
							{ops.map(o => (
								<tr key={o.id} className="border-t hover:bg-slate-50">
									<td className="px-3 py-2 font-mono text-xs">
										{o.submissionDate ? o.submissionDate.slice(0, 10) : '—'}
									</td>
									<td className="px-3 py-2">
										<div className="font-medium">{o.title}</div>
										<div className="text-xs text-slate-600">Priority: {o.priorityRank ?? '—'}</div>
									</td>
									<td className="px-3 py-2">{o.clientName || o.clientId || '-'}</td>
									<td className="px-3 py-2">{o.stage || '—'}</td>
									<td className="px-3 py-2">{o.status || '—'}</td>
									<td className="px-3 py-2">
										<SlaBadge daysLeft={o.daysLeft} />
									</td>
								</tr>
							))}
							{ops.length === 0 && (
								<tr>
									<td colSpan={6} className="px-3 py-4 text-center text-slate-500">
										No opportunities yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</Page>
	)
}
