import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, Approval, PricingPack } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'

export default function ApprovalsPage() {
	const { id } = useParams<{ id: string }>()
	const qc = useQueryClient()
	const [remarks, setRemarks] = useState<Record<string, string>>({})

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
		mutationFn: () => api.bootstrapApprovals(pack.data?.id || ''),
		onSuccess: data => qc.setQueryData(['approvals', id], data)
	})

	const submitDecision = useMutation({
		mutationFn: (input: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
			api.submitApprovalDecision(input.id, { status: input.status, remarks: remarks[input.id] || undefined }),
		onSuccess: () => approvals.refetch()
	})

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'APPROVED':
				return 'bg-green-100 text-green-800'
			case 'REJECTED':
				return 'bg-red-100 text-red-800'
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
								{(approvals.data?.length || 0) === 0 && (
									<button
										className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
										onClick={() => bootstrap.mutate()}
										disabled={bootstrap.isPending}
									>
										{bootstrap.isPending ? 'Creating...' : 'Start Approval Process'}
									</button>
								)}
							</div>

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

												{a.remarks && (
													<p className="mt-2 text-sm text-slate-600">Remarks: {a.remarks}</p>
												)}

												{a.status === 'PENDING' && (
													<div className="mt-3 flex flex-col gap-2">
														<textarea
															className="w-full rounded border p-2 text-sm"
															placeholder="Optional remarks"
															rows={2}
															value={remarks[a.id] || ''}
															onChange={e => setRemarks({ ...remarks, [a.id]: e.target.value })}
														/>
														<div className="flex gap-2">
															<button
																className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
																onClick={() => submitDecision.mutate({ id: a.id, status: 'APPROVED' })}
																disabled={submitDecision.isPending}
															>
																Approve
															</button>
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
									{approvals.data?.every(a => a.status === 'APPROVED') ? (
										<p className="font-medium text-green-700">✓ All approvals complete - Ready for submission</p>
									) : approvals.data?.some(a => a.status === 'REJECTED') ? (
										<p className="font-medium text-red-700">✗ Approval rejected - Review and resubmit</p>
									) : (
										<p className="text-amber-700">
											⏳ Awaiting approvals ({approvals.data?.filter(a => a.status === 'APPROVED').length}/
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

