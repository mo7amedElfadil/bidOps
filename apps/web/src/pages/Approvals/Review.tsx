import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../api/client'
import { Page } from '../../components/Page'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { toast } from '../../utils/toast'
import { getUserId, getUserRole } from '../../utils/auth'

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
	const role = getUserRole()
	const userId = getUserId()
	const canViewAll = role === 'ADMIN' || role === 'MANAGER'
	const [scope, setScope] = useState<'mine' | 'all'>(canViewAll ? 'mine' : 'mine')
	const review = useQuery({
		queryKey: ['approvals', 'review', scope],
		queryFn: () => api.reviewApprovals({ scope }),
		refetchOnWindowFocus: false
	})
	const queryClient = useQueryClient()
	const [finalizingPack, setFinalizingPack] = useState<string | null>(null)
	const canFinalize = canViewAll

	const finalize = useMutation({
		mutationFn: (packId: string) => api.finalizeApproval(packId),
		onMutate: packId => {
			setFinalizingPack(packId)
		},
		onSuccess: async () => {
			toast.success('Bid marked ready for submission')
			review.refetch()
			await queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
		},
		onError: (err: any) => {
			toast.error(err?.message || 'Failed to finalize the bid')
		},
		onSettled: () => {
			setFinalizingPack(null)
		}
	})

const packs = review.data || []

	const pendingStatuses = useMemo(
		() => new Set(['PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'RESUBMITTED']),
		[]
	)

	function isAssignedToUser(approval: { approverId?: string | null; approverIds?: string[] | null }) {
		if (!userId) return false
		if (approval.approverId && approval.approverId === userId) return true
		if (approval.approverIds?.length && approval.approverIds.includes(userId)) return true
		return false
	}

	return (
		<Page
			title="Bid Review & Approvals"
			subtitle="Track pricing packs, review pending approvals, and finalize bids when all signatures are complete."
		>
			<div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
				<label className="text-xs font-semibold text-slate-500">Queue</label>
				<select
					className="rounded border px-2 py-1 text-xs"
					value={scope}
					onChange={e => setScope(e.target.value as 'mine' | 'all')}
				>
					<option value="mine">My queue</option>
					{canViewAll && <option value="all">All approvals</option>}
				</select>
			</div>
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
						const nextApproval = pack.nextApproval
						const readyToFinalize = pack.readyToFinalize || (allApproved && !hasRejected)
						const myPending = nextApproval ? isAssignedToUser(nextApproval) : false

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
								{pack.nextStageLabel && (
									<p className="mt-2 text-xs text-slate-500">
										Next stage: <span className="font-semibold">{pack.nextStageLabel}</span>
										{pack.nextActionLabel ? ` • ${pack.nextActionLabel}` : ''}
										{pack.blockedReason ? ` • ${pack.blockedReason}` : ''}
										{myPending && pack.nextActionLabel ? (
											<span className="ml-2 text-xs font-semibold text-blue-600">Assigned to you</span>
										) : null}
									</p>
								)}

							<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
								<div className="text-sm text-slate-500">
									{hasRejected ? (
										'One or more approvers rejected this pack. Review comments and rerun approvals.'
									) : allApproved ? (
										'All approvals completed.'
									) : pack.blockedReason ? (
										<>
											{pack.blockedReason}
											{myPending && pack.nextActionLabel ? ` • Your action required: ${pack.nextActionLabel}` : myPending ? '' : pack.nextActionLabel ? ` • Next: ${pack.nextActionLabel}` : ''}
										</>
									) : (
										`${approvals.filter(a => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status)).length}/${approvals.length} approvals done.`
									)}
								</div>
								<Button
									size="sm"
									variant="primary"
									disabled={!pack.readyToFinalize || finalize.isPending || !approvals.length || !canFinalize}
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
