import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api, type Opportunity } from '../../api/client'
import { SlaBadge } from '../../components/SlaBadge'
import { Page } from '../../components/Page'

export default function Board() {
	const { data, isLoading } = useQuery({
		queryKey: ['opportunities'],
		queryFn: () => api.listOpportunities()
	})

	const byStage = useMemo(
		() =>
			(data || []).reduce((acc, item) => {
				const k = item.stage || 'Unstaged'
				;(acc[k] ||= []).push(item)
				return acc
			}, {} as Record<string, Opportunity[]>),
		[data]
	)

	return (
		<Page
			title="Kanban"
			subtitle="Opportunities grouped by stage with SLA indicators."
			actions={
				<Link to="/" className="rounded bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">
					Table
				</Link>
			}
		>
			{isLoading ? (
				<p className="text-sm text-slate-600">Loading...</p>
			) : (
				<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
					{Object.entries(byStage).map(([stage, items]) => (
						<div key={stage} className="rounded border bg-white">
							<div className="border-b bg-gray-100 px-3 py-2 font-medium">{stage}</div>
							<div className="space-y-2 p-3">
								{items.map(o => (
									<div key={o.id} className="rounded border p-2">
										<div className="flex items-center justify-between">
											<Link
												to={`/opportunity/${o.id}`}
												className="text-sm font-medium hover:underline"
											>
												{o.title}
											</Link>
											<SlaBadge daysLeft={o.daysLeft} />
										</div>
										<div className="mt-1 text-xs text-gray-500">
											Due: {o.submissionDate ? o.submissionDate.slice(0, 10) : '-'}
										</div>
									</div>
								))}
								{items.length === 0 && (
									<p className="text-xs text-slate-500">No items in this stage.</p>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</Page>
	)
}


