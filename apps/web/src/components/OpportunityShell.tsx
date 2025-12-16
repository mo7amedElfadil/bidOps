import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api, Opportunity } from '../api/client'
import { SlaBadge } from './SlaBadge'

type TabKey =
	| 'overview'
	| 'attachments'
	| 'compliance'
	| 'clarifications'
	| 'pricing'
	| 'approvals'
	| 'submission'
	| 'outcome'

const tabs: { key: TabKey; label: string; href: (id: string) => string }[] = [
	{ key: 'overview', label: 'Overview', href: id => `/opportunity/${id}` },
	{ key: 'attachments', label: 'Attachments', href: id => `/opportunity/${id}/attachments` },
	{ key: 'compliance', label: 'Compliance', href: id => `/opportunity/${id}/compliance` },
	{ key: 'clarifications', label: 'Clarifications', href: id => `/opportunity/${id}/clarifications` },
	{ key: 'pricing', label: 'Pricing', href: id => `/opportunity/${id}/pricing` },
	{ key: 'approvals', label: 'Approvals', href: id => `/opportunity/${id}/approvals` },
	{ key: 'submission', label: 'Submission', href: id => `/opportunity/${id}/submission` },
	{ key: 'outcome', label: 'Outcome', href: id => `/opportunity/${id}/outcome` }
]

export function OpportunityShell({ active, children }: { active: TabKey; children: React.ReactNode }) {
	const { id } = useParams<{ id: string }>()
	const { data, isLoading, error } = useQuery({
		queryKey: ['opportunity', id],
		enabled: Boolean(id),
		queryFn: () => api.getOpportunity(id || '')
	})

	return (
		<div className="mx-auto max-w-6xl p-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Link to="/" className="text-sm text-blue-600 hover:underline">
						← Opportunities
					</Link>
					<h1 className="mt-1 text-xl font-semibold">{data?.title || 'Opportunity'}</h1>
					<p className="text-sm text-slate-600">
						Client: {data?.clientId || '—'} • Stage: {data?.stage || '—'} • Status: {data?.status || '—'}
					</p>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="rounded bg-slate-100 px-2 py-1 font-medium">
						Due: {data?.submissionDate ? data.submissionDate.slice(0, 10) : '—'}
					</span>
					<SlaBadge daysLeft={data?.daysLeft} />
				</div>
			</header>

			<nav className="mt-4 flex flex-wrap gap-2 text-sm">
				{tabs.map(tab => (
					<Link
						key={tab.key}
						to={tab.href(id || '')}
						className={`rounded px-3 py-1.5 hover:bg-slate-100 ${
							active === tab.key ? 'bg-slate-200 font-medium' : ''
						}`}
					>
						{tab.label}
					</Link>
				))}
			</nav>

			<div className="mt-4 rounded border bg-white shadow-sm">
				{isLoading ? (
					<p className="p-4 text-sm text-slate-600">Loading opportunity...</p>
				) : error ? (
					<p className="p-4 text-sm text-red-600">Failed to load: {(error as Error).message}</p>
				) : (
					<div>{children}</div>
				)}
			</div>
		</div>
	)
}

