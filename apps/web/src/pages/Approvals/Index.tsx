import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, Approval, PricingPack } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'

export default function ApprovalsPage() {
	const { id } = useParams<{ id: string }>()
	const qc = useQueryClient()
	const [comments, setComments] = useState<Record<string, string>>({})

	const pack = useQuery({
		queryKey: ['pack', id, 'approvals'],
		enabled: Boolean(id),
		queryFn: () => api.recalcPack(id || '', {})
	})

	const approvals = useQuery({
		queryKey: ['approvals', id],
		enabled: Boolean(pack.data?.id),
		queryFn: () => api.listApprovals(pack.data?.id || '')
	})

	const bootstrap = useMutation({
		mutationFn: (packId: string) => api.bootstrapApprovals(packId),
		onSuccess: data => qc.setQueryData(['approvals', id], data)
	})

	const submitDecision = useMutation({
		mutationFn: (input: { id: string; status: 'PENDING' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED' }) =>
			api.submitApprovalDecision(input.id, { status: input.status, comment: comments[input.id] || undefined }),
		onSuccess: () => approvals.refetch()
	})

	const pendingStatuses = new Set(['PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'RESUBMITTED'])

	const approvalRows = approvals.data || []
	const nextApproval = approvalRows.find(approval => pendingStatuses.has(approval.status)) ?? null
	const approvalsComplete =
		approvalRows.length > 0 &&
		approvalRows.every(approval => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(approval.status))

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'APPROVED':
			case 'APPROVED_WITH_CONDITIONS':
				return 'bg-green-100 text-green-800'
			case 'REJECTED':
				return 'bg-red-100 text-red-800'
			case 'CHANGES_REQUESTED':
				return 'bg-orange-100 text-orange-800'
			case 'RESUBMITTED':
				return 'bg-sky-100 text-sky-800'
			case 'IN_REVIEW':
				return 'bg-blue-100 text-blue-800'
			default:
				return 'bg-amber-100 text-amber-800'
		}
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case 'LEGAL':
				return '1. Legal'
			case 'FINANCE':
				return '2. Finance'
			case 'EXECUTIVE':
				return '3. Executive'
			default:
				return type
		}
	}

	const getActionLabel = (type: string) => {
		switch (type) {
			case 'LEGAL':
				return 'Approve Working Stage'
			case 'FINANCE':
				return 'Approve Pricing Stage'
			case 'EXECUTIVE':
				return 'Approve Final Submission'
			default:
				return 'Approve'
		}
	}

	return (
		<OpportunityShell active="approvals">
			<div className="p-4">
				{pack.isLoading ? (
					<p className="text-sm text-slate-600">Loading...</p>
				) : (
					<>
						{/* Pricing Pack Summary */}
						{pack.data && (
							<div className="rounded border bg-white p-4 shadow-sm">
								<h2 className="font-medium">Pricing Pack v{pack.data.version}</h2>
								<div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
									<div>
										Base Cost: <span className="font-medium">{pack.data.baseCost.toFixed(2)}</span>
									</div>
									<div>
										Margin: <span className="font-medium">{(pack.data.margin * 100).toFixed(0)}%</span>
									</div>
									<div className="font-bold text-indigo-700">Total: {pack.data.totalPrice.toFixed(2)}</div>
								</div>
							</div>
						)}

						{/* Approval Chain */}
						<div className="mt-6">
							<div className="flex items-center justify-between">
								<h2 className="font-semibold">Approval Chain</h2>
								{(approvals.data?.length || 0) === 0 && pack.data?.id && (
									<button
										className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
										onClick={() => bootstrap.mutate(pack.data.id)}
										disabled={bootstrap.isPending}
									>
										{bootstrap.isPending ? 'Creating...' : 'Start Approval Process'}
									</button>
								)}
							</div>

							{approvalRows.length > 0 && (
								<div className="mt-4 rounded border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
									<p className="font-semibold text-slate-900">
										{approvalsComplete ? 'All approvals complete — ready for submission' : `Awaiting ${getTypeLabel(nextApproval?.type || '')}`}
									</p>
									<p className="mt-1 text-xs text-slate-500">
										{nextApproval
											? `Next action: ${getActionLabel(nextApproval.type)}${nextApproval.approverRole ? ` (${nextApproval.approverRole})` : ''}`
											: 'No pending stages. Reviewers may finalize the submission.'}
									</p>
								</div>
							)}

							{approvals.isLoading ? (
								<p className="mt-3 text-sm text-slate-600">Loading approvals...</p>
							) : (approvals.data?.length || 0) === 0 ? (
								<div className="mt-4 rounded border bg-slate-100 p-4 text-center text-sm text-slate-600">
									No approval chain started yet. Click "Start Approval Process" to create the approval chain.
								</div>
							) : (
								<div className="mt-4 space-y-3">
									{approvals.data
										?.sort((a, b) => {
											const order = { LEGAL: 1, FINANCE: 2, EXECUTIVE: 3 }
											return (order[a.type] || 0) - (order[b.type] || 0)
										})
										.map(a => (
											<div key={a.id} className="rounded border bg-white p-4 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<span className="font-medium">{getTypeLabel(a.type)}</span>
														<span className={`ml-2 rounded px-2 py-0.5 text-xs ${getStatusColor(a.status)}`}>
															{a.status}
														</span>
													</div>
													{a.signedOn && (
														<span className="text-xs text-slate-500">
															{new Date(a.signedOn).toLocaleDateString()}
														</span>
													)}
												</div>

												{(a.comment || a.remarks) && (
													<p className="mt-2 text-sm text-slate-600">Remarks: {a.comment || a.remarks}</p>
												)}

												{['PENDING', 'IN_REVIEW', 'RESUBMITTED', 'CHANGES_REQUESTED'].includes(a.status) && (
													<div className="mt-3 flex flex-col gap-2">
														<textarea
															className="w-full rounded border p-2 text-sm"
															placeholder="Optional remarks"
															rows={2}
															value={comments[a.id] || ''}
															onChange={e => setComments({ ...comments, [a.id]: e.target.value })}
														/>
														<div className="flex gap-2">
															<button
																className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
																onClick={() => submitDecision.mutate({ id: a.id, status: 'APPROVED' })}
																disabled={submitDecision.isPending}
															>
																{getActionLabel(a.type)}
															</button>
															<button
																className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
																onClick={() => submitDecision.mutate({ id: a.id, status: 'CHANGES_REQUESTED' })}
																disabled={submitDecision.isPending}
															>
																Request changes
															</button>
															{a.status === 'CHANGES_REQUESTED' && (
																<button
																	className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
																	onClick={() => submitDecision.mutate({ id: a.id, status: 'RESUBMITTED' })}
																	disabled={submitDecision.isPending}
																>
																	Mark resubmitted
																</button>
															)}
															<button
																className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
																onClick={() => submitDecision.mutate({ id: a.id, status: 'REJECTED' })}
																disabled={submitDecision.isPending}
															>
																Reject
															</button>
														</div>
													</div>
												)}
											</div>
										))}
								</div>
							)}
						</div>

						{/* Status Summary */}
						{(approvals.data?.length || 0) > 0 && (
							<div className="mt-6 rounded border bg-white p-4 shadow-sm">
								<h3 className="font-medium">Approval Status Summary</h3>
								<div className="mt-2 text-sm">
									{approvals.data?.every(a => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status)) ? (
										<p className="font-medium text-green-700">✓ All approvals complete - Ready for submission</p>
									) : approvals.data?.some(a => a.status === 'REJECTED') ? (
										<p className="font-medium text-red-700">✗ Approval rejected - Review and resubmit</p>
									) : (
										<p className="text-amber-700">
											⏳ Awaiting approvals ({approvals.data?.filter(a => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status)).length}/
											{approvals.data?.length} complete)
										</p>
									)}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</OpportunityShell>
	)
}
