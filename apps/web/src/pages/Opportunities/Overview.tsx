import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'
import { SlaBadge } from '../../components/SlaBadge'

export default function OpportunityOverview() {
	const { id } = useParams<{ id: string }>()
	const { data, isLoading } = useQuery({
		queryKey: ['opportunity', id],
		enabled: Boolean(id),
		queryFn: () => api.getOpportunity(id || '')
	})

	return (
		<OpportunityShell active="overview">
			<div className="grid gap-6 p-6 md:grid-cols-2">
				<div className="space-y-3">
					<h2 className="text-lg font-semibold">Summary</h2>
					<div className="rounded border bg-slate-50 p-4 text-sm">
						<p><span className="font-medium">Client:</span> {data?.clientId || '—'}</p>
						<p><span className="font-medium">Stage:</span> {data?.stage || '—'}</p>
						<p><span className="font-medium">Status:</span> {data?.status || '—'}</p>
						<p><span className="font-medium">Priority:</span> {data?.priorityRank ?? '—'}</p>
						<p className="flex items-center gap-2">
							<span className="font-medium">Submission:</span>
							{data?.submissionDate ? data.submissionDate.slice(0, 10) : '—'}
							<SlaBadge daysLeft={data?.daysLeft} />
						</p>
					</div>
				</div>
				<div className="space-y-3">
					<h2 className="text-lg font-semibold">Quick Links</h2>
					<div className="grid gap-2 sm:grid-cols-2">
						{[
							{ href: `/opportunity/${id}/attachments`, label: 'Attachments' },
							{ href: `/opportunity/${id}/compliance`, label: 'Compliance Matrix' },
							{ href: `/opportunity/${id}/clarifications`, label: 'Clarifications' },
							{ href: `/opportunity/${id}/pricing`, label: 'Pricing Workspace' },
							{ href: `/opportunity/${id}/approvals`, label: 'Approvals' },
							{ href: `/opportunity/${id}/submission`, label: 'Submission Pack' },
							{ href: `/opportunity/${id}/outcome`, label: 'Outcome' }
						].map(link => (
							<Link
								key={link.href}
								to={link.href}
								className="rounded border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:border-blue-300 hover:text-blue-700"
							>
								{link.label}
							</Link>
						))}
					</div>
					{isLoading && <p className="text-sm text-slate-600">Loading quick stats...</p>}
					<div className="rounded border bg-white p-3 text-xs text-slate-600">
						<p>Use this overview to confirm key dates and jump into detailed workspaces.</p>
					</div>
				</div>
			</div>
		</OpportunityShell>
	)
}

