import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, PricingPackReview } from '../../api/client'
import { Page } from '../../components/Page'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { toast } from '../../utils/toast'

const statusClasses: Record<string, string> = {
	APPROVED: 'bg-green-100 text-green-800',
	APPROVED_WITH_CONDITIONS: 'bg-green-100 text-green-800',
	REJECTED: 'bg-red-100 text-red-800',
	PENDING: 'bg-amber-100 text-amber-800'
}

const typeLabels: Record<string, string> = {
	LEGAL: '1. Legal',
	FINANCE: '2. Finance',
	EXECUTIVE: '3. Executive'
}

function formatDate(value?: string) {
	if (!value) return 'TBD'
	return new Date(value).toLocaleString()
}

export default function ApprovalReviewPage() {
	const review = useQuery({
		queryKey: ['approvals', 'review'],
		queryFn: api.reviewApprovals,
		refetchOnWindowFocus: false
	})
	const [finalizingPack, setFinalizingPack] = useState<string | null>(null)

	const finalize = useMutation({
		mutationFn: (packId: string) => api.finalizeApproval(packId),
		onMutate: packId => {
			setFinalizingPack(packId)
		},
		onSuccess: () => {
			toast.success('Bid marked ready for submission')
			review.refetch()
		},
		onError: (err: any) => {
			toast.error(err?.message || 'Failed to finalize the bid')
		},
		onSettled: () => {
			setFinalizingPack(null)
		}
	})

	const packs = review.data || []

	return (
		<Page
			title="Bid Review & Approvals"
			subtitle="Track pricing packs, review pending approvals, and finalize bids when all signatures are complete."
		>
			{review.isLoading ? (
				<p className="mt-6 text-sm text-slate-600">Loading review queue...</p>
			) : packs.length === 0 ? (
				<div className="mt-6 rounded border border-dashed border-slate-300 bg-white/80 p-6 text-center text-sm text-slate-600">
					No bids are currently awaiting review. Start by building a pricing pack and kicking off the approval chain.
				</div>
			) : (
				<div className="mt-6 space-y-4">
					{packs.map(pack => {
						const approvals = pack.approvals || []
						const allApproved =
							approvals.length > 0 &&
							approvals.every(a => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status))
						const hasRejected = approvals.some(a => a.status === 'REJECTED')
						const isFinalizing = finalizingPack === pack.id
						const readyToFinalize = allApproved && !hasRejected

						return (
							<Card key={pack.id}>
								<div className="flex flex-wrap items-start justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opportunity</p>
										<h3 className="text-lg font-semibold text-slate-900">{pack.opportunity.title}</h3>
										<p className="text-sm text-slate-600">{pack.opportunity.client?.name || 'Unknown client'}</p>
									</div>
									<div className="text-sm text-slate-500">
										<div>Stage: {pack.opportunity.stage || '—'}</div>
										<div>Status: {pack.opportunity.status || '—'}</div>
										<div>Submission: {formatDate(pack.opportunity.submissionDate)}</div>
									</div>
								</div>

								<div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
									<div>
										Base Cost:
										<span className="ml-1 font-semibold text-slate-900">{pack.baseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
									</div>
									<div>
										Margin:
										<span className="ml-1 font-semibold text-slate-900">{(pack.margin * 100).toFixed(0)}%</span>
									</div>
									<div>
										Total:
										<span className="ml-1 font-semibold text-indigo-700">{pack.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
									</div>
								</div>

								<div className="mt-4 flex flex-wrap items-center gap-2">
									{approvals.map(approval => (
										<span
											key={approval.id}
											className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[approval.status]} ${
												approval.approverId ? 'border-transparent' : 'border-slate-200'
											}`}
										>
											{typeLabels[approval.type] || approval.type} • {approval.status}
										</span>
									))}
								</div>

								<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
									<div className="text-sm text-slate-500">
										{hasRejected
											? 'One or more approvers rejected this pack. Review comments and rerun approvals.'
											: allApproved
												? 'All approvals completed.'
												: `${approvals.filter(a => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status)).length}/${approvals.length} approvals done.`}
									</div>
									<Button
										size="sm"
										variant="primary"
										disabled={!readyToFinalize || finalize.isPending || !approvals.length}
										onClick={() => finalize.mutate(pack.id)}
										className="whitespace-nowrap"
									>
										{isFinalizing ? 'Finalizing...' : 'Finalize for submission'}
									</Button>
								</div>
							</Card>
						)
					})}
				</div>
			)}
		</Page>
	)
}
