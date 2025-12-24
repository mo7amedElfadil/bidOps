import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Page } from '../../components/Page'
import { DEFAULT_STAGE_LIST, DEFAULT_STATUS_LIST } from '../../constants/opportunity-lists'
import { isPostSubmission } from '../../utils/postSubmission'

export default function PostSubmissionPage() {
	const [page] = useState(1)
	const [pageSize] = useState(200)
	const timezoneQuery = useQuery({ queryKey: ['timezone'], queryFn: api.getTimezoneSettings })
	const stageListQuery = useQuery({ queryKey: ['opportunity-stages'], queryFn: api.getOpportunityStages })
	const statusListQuery = useQuery({ queryKey: ['opportunity-statuses'], queryFn: api.getOpportunityStatuses })
	const stageOptions = stageListQuery.data?.stages ?? DEFAULT_STAGE_LIST
	const statusOptions = statusListQuery.data?.statuses ?? DEFAULT_STATUS_LIST

	const opportunities = useQuery({
		queryKey: ['opportunities', 'post-submission', page, pageSize],
		queryFn: () => api.listOpportunities({ page, pageSize })
	})

	const rows = useMemo(() => {
		const items = opportunities.data?.items || []
		return items.filter(o => isPostSubmission(o, { stageOptions, statusOptions }))
	}, [opportunities.data?.items, stageOptions, statusOptions])

	return (
		<Page
			title="Post Submission"
			subtitle="Opportunities that are past deadline or already finalized for submission."
			actions={
				<Link to="/opportunities" className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">
					Back to Opportunities
				</Link>
			}
		>
			{opportunities.isLoading ? (
				<p className="mt-4 text-sm text-slate-600">Loading...</p>
			) : (
				<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-100">
							<tr>
								<th className="px-3 py-2 text-left">Title</th>
								<th className="px-3 py-2 text-left">Client</th>
								<th className="px-3 py-2 text-left">Status</th>
								<th className="px-3 py-2 text-left">Stage</th>
								<th className="px-3 py-2 text-left">Due</th>
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
									<td className="px-3 py-2">{o.status || '-'}</td>
									<td className="px-3 py-2">{o.stage || '-'}</td>
									<td className="px-3 py-2">
										{o.submissionDate
											? new Date(
													new Date(o.submissionDate).getTime() +
														(timezoneQuery.data?.offsetHours ?? 3) * 60 * 60 * 1000
												).toLocaleString()
											: '-'}
									</td>
									<td className="px-3 py-2">
										<div className="flex flex-wrap gap-1">
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
							{rows.length === 0 && (
								<tr>
									<td colSpan={6} className="px-3 py-4 text-center text-slate-500">
										No post-submission opportunities yet.
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
