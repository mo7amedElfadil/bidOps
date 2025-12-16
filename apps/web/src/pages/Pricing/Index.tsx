import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, BoQItem, VendorQuote, PricingPack } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'

const MIN_MARGIN = Number(import.meta.env.VITE_MIN_MARGIN ?? 10) / 100

export default function PricingPage() {
	const { id } = useParams<{ id: string }>()
	const qc = useQueryClient()
	const [showAddBoq, setShowAddBoq] = useState(false)
	const [showAddQuote, setShowAddQuote] = useState(false)
	const [newBoq, setNewBoq] = useState({ lineNo: 1, description: '', qty: 1, unitCost: 0, markup: 0.15 })
	const [newQuote, setNewQuote] = useState({ vendor: '', quoteNo: '', currency: 'QAR' })
	const [packParams, setPackParams] = useState({ overheads: 0.1, contingency: 0.05, fxRate: 1, margin: 0.15 })
	const [error, setError] = useState<string | null>(null)

	const boq = useQuery({
		queryKey: ['boq', id],
		enabled: Boolean(id),
		queryFn: () => api.listBoQ(id || '')
	})
	const quotes = useQuery({
		queryKey: ['quotes', id],
		enabled: Boolean(id),
		queryFn: () => api.listQuotes(id || '')
	})
	const packCalc = useQuery({
		queryKey: ['pack', id, packParams],
		enabled: false,
		queryFn: () => api.recalcPack(id || '', packParams)
	})

	const addBoq = useMutation({
		mutationFn: () =>
			api.createBoQ(id || '', {
				...newBoq,
				unitPrice: newBoq.unitCost * (1 + newBoq.markup)
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['boq', id] })
			setShowAddBoq(false)
			setNewBoq({ lineNo: (boq.data?.length || 0) + 1, description: '', qty: 1, unitCost: 0, markup: 0.15 })
		}
	})

	const addQuote = useMutation({
		mutationFn: () => api.createQuote(id || '', newQuote),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['quotes', id] })
			setShowAddQuote(false)
			setNewQuote({ vendor: '', quoteNo: '', currency: 'QAR' })
		}
	})

	const deleteBoq = useMutation({
		mutationFn: (itemId: string) => api.deleteBoQ(itemId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['boq', id] })
	})

	const recalc = useMutation({
		mutationFn: async () => {
			setError(null)
			if (packParams.margin < MIN_MARGIN) {
				throw new Error(`Margin below guardrail (${(MIN_MARGIN * 100).toFixed(0)}%). Increase margin.`)
			}
			return api.recalcPack(id || '', packParams)
		},
		onSuccess: data => qc.setQueryData(['pack', id], data),
		onError: e => setError((e as Error).message)
	})

	const totalBoq = (boq.data || []).reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
	const pack: PricingPack | undefined = (qc.getQueryData(['pack', id]) as PricingPack | undefined) || packCalc.data || undefined

	return (
		<OpportunityShell active="pricing">
			<div className="p-4">
				{/* BoQ Section */}
				<div>
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">Bill of Quantities</h2>
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={() => setShowAddBoq(true)}
						>
							+ Add Item
						</button>
					</div>

					{showAddBoq && (
						<div className="mt-3 rounded border bg-white p-4 shadow-sm">
							<div className="grid gap-3 sm:grid-cols-5">
								<div>
									<label className="block text-xs font-medium">Line #</label>
									<input
										type="number"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.lineNo}
										onChange={e => setNewBoq({ ...newBoq, lineNo: +e.target.value })}
									/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-xs font-medium">Description</label>
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.description}
										onChange={e => setNewBoq({ ...newBoq, description: e.target.value })}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium">Qty</label>
									<input
										type="number"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.qty}
										onChange={e => setNewBoq({ ...newBoq, qty: +e.target.value })}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium">Unit Cost</label>
									<input
										type="number"
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newBoq.unitCost}
										onChange={e => setNewBoq({ ...newBoq, unitCost: +e.target.value })}
									/>
								</div>
							</div>
							<div className="mt-3 flex gap-2">
								<button
									className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
									onClick={() => addBoq.mutate()}
									disabled={!newBoq.description || addBoq.isPending}
								>
									{addBoq.isPending ? 'Saving...' : 'Save'}
								</button>
								<button
									className="rounded bg-slate-200 px-3 py-1.5 text-sm"
									onClick={() => setShowAddBoq(false)}
									disabled={addBoq.isPending}
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					{boq.isLoading ? (
						<p className="mt-3 text-sm text-slate-600">Loading...</p>
					) : (
						<div className="mt-3 overflow-x-auto rounded border bg-white shadow-sm">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-100">
									<tr>
										<th className="px-3 py-2 text-left">#</th>
										<th className="px-3 py-2 text-left">Description</th>
										<th className="px-3 py-2 text-right">Qty</th>
										<th className="px-3 py-2 text-right">Unit Cost</th>
										<th className="px-3 py-2 text-right">Markup</th>
										<th className="px-3 py-2 text-right">Unit Price</th>
										<th className="px-3 py-2 text-right">Total</th>
										<th className="px-3 py-2"></th>
									</tr>
								</thead>
								<tbody>
									{(boq.data || []).map(i => (
										<tr key={i.id} className="border-t">
											<td className="px-3 py-2">{i.lineNo}</td>
											<td className="px-3 py-2">{i.description}</td>
											<td className="px-3 py-2 text-right">{i.qty}</td>
											<td className="px-3 py-2 text-right">{i.unitCost.toFixed(2)}</td>
											<td className="px-3 py-2 text-right">{(i.markup * 100).toFixed(0)}%</td>
											<td className="px-3 py-2 text-right">{i.unitPrice.toFixed(2)}</td>
											<td className="px-3 py-2 text-right font-medium">{(i.qty * i.unitPrice).toFixed(2)}</td>
											<td className="px-3 py-2">
												<button
													className="text-xs text-red-600 hover:underline"
													onClick={() => {
														if (confirm('Delete this BoQ item?')) deleteBoq.mutate(i.id)
													}}
													disabled={deleteBoq.isPending}
												>
													Delete
												</button>
											</td>
										</tr>
									))}
									<tr className="border-t bg-slate-50 font-semibold">
										<td colSpan={6} className="px-3 py-2 text-right">
											Total BoQ
										</td>
										<td className="px-3 py-2 text-right">{totalBoq.toFixed(2)}</td>
										<td></td>
									</tr>
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Vendor Quotes */}
				<div className="mt-8">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">Vendor Quotes</h2>
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={() => setShowAddQuote(true)}
						>
							+ Add Quote
						</button>
					</div>

					{showAddQuote && (
						<div className="mt-3 rounded border bg-white p-4 shadow-sm">
							<div className="grid gap-3 sm:grid-cols-3">
								<div>
									<label className="block text-xs font-medium">Vendor</label>
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newQuote.vendor}
										onChange={e => setNewQuote({ ...newQuote, vendor: e.target.value })}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium">Quote No</label>
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newQuote.quoteNo}
										onChange={e => setNewQuote({ ...newQuote, quoteNo: e.target.value })}
									/>
								</div>
								<div>
									<label className="block text-xs font-medium">Currency</label>
									<input
										className="mt-1 w-full rounded border p-2 text-sm"
										value={newQuote.currency}
										onChange={e => setNewQuote({ ...newQuote, currency: e.target.value })}
									/>
								</div>
							</div>
							<div className="mt-3 flex gap-2">
								<button
									className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
									onClick={() => addQuote.mutate()}
									disabled={!newQuote.vendor || addQuote.isPending}
								>
									{addQuote.isPending ? 'Saving...' : 'Save'}
								</button>
								<button
									className="rounded bg-slate-200 px-3 py-1.5 text-sm"
									onClick={() => setShowAddQuote(false)}
									disabled={addQuote.isPending}
								>
									Cancel
								</button>
							</div>
						</div>
					)}

					<div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{quotes.data?.map(q => (
							<div key={q.id} className="rounded border bg-white p-4 shadow-sm">
								<div className="font-medium">{q.vendor}</div>
								<div className="mt-1 text-xs text-slate-600">
									{q.quoteNo && <span>Quote: {q.quoteNo}</span>}
									{q.currency && <span className="ml-2">• {q.currency}</span>}
								</div>
							</div>
						))}
						{quotes.data?.length === 0 && <p className="text-sm text-slate-600">No quotes yet.</p>}
					</div>
				</div>

				{/* Pricing Pack Calculator */}
				<div className="mt-8 rounded border bg-white p-4 shadow-sm">
					<h2 className="font-semibold">Pricing Pack Calculator</h2>
					<div className="mt-3 grid gap-3 sm:grid-cols-4">
						<div>
							<label className="block text-xs font-medium">Overheads %</label>
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border p-2 text-sm"
								value={packParams.overheads * 100}
								onChange={e => setPackParams({ ...packParams, overheads: +e.target.value / 100 })}
							/>
						</div>
						<div>
							<label className="block text-xs font-medium">Contingency %</label>
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border p-2 text-sm"
								value={packParams.contingency * 100}
								onChange={e => setPackParams({ ...packParams, contingency: +e.target.value / 100 })}
							/>
						</div>
						<div>
							<label className="block text-xs font-medium">FX Rate</label>
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border p-2 text-sm"
								value={packParams.fxRate}
								onChange={e => setPackParams({ ...packParams, fxRate: +e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-xs font-medium">Margin %</label>
							<input
								type="number"
								step="0.01"
								className="mt-1 w-full rounded border p-2 text-sm"
								value={packParams.margin * 100}
								onChange={e => setPackParams({ ...packParams, margin: +e.target.value / 100 })}
							/>
							<p className="mt-1 text-xs text-slate-500">Minimum margin: {(MIN_MARGIN * 100).toFixed(0)}%</p>
						</div>
					</div>
					<button
						className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
						onClick={() => recalc.mutate()}
						disabled={recalc.isPending}
					>
						{recalc.isPending ? 'Recalculating...' : 'Recalculate Pack'}
					</button>
					{error && (
						<div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
							{error}
						</div>
					)}

					{pack && (
						<div className="mt-4 rounded bg-indigo-50 p-4">
							<div className="grid gap-2 text-sm sm:grid-cols-3">
								<div>
									Base Cost: <span className="font-medium">{pack.baseCost.toFixed(2)}</span>
								</div>
								<div>
									Version: <span className="font-medium">{pack.version}</span>
								</div>
								<div className="text-lg font-bold text-indigo-700">Total: {pack.totalPrice.toFixed(2)}</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</OpportunityShell>
	)
}

