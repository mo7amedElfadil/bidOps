import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, Clarification } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'
import { getToken } from '../../utils/auth'
import { downloadWithAuth } from '../../utils/download'

export default function ClarificationsPage() {
	const qc = useQueryClient()
	const { id } = useParams<{ id: string }>()
	const [showAdd, setShowAdd] = useState(false)
	const [newQ, setNewQ] = useState({ questionNo: '', text: '', status: 'open' })
	const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

	const list = useQuery({
		queryKey: ['clarifications', id],
		enabled: Boolean(id),
		queryFn: () => api.listClarifications(id || '')
	})

	const addQuestion = useMutation({
		mutationFn: () => api.createClarification(id || '', newQ),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['clarifications', id] })
			setShowAdd(false)
			setNewQ({ questionNo: '', text: '', status: 'open' })
		}
	})

	const updateRow = useMutation({
		mutationFn: (r: Clarification) =>
			api.updateClarification(r.id, {
				status: r.status,
				responseText: r.responseText
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['clarifications', id] })
	})

	const importCsv = useMutation({
		mutationFn: async (file: File) => {
			const fd = new FormData()
			fd.append('file', file)
			const token = getToken()
			const res = await fetch(`${API}/clarifications/${id}/import.csv`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: fd
			})
			if (!res.ok) throw new Error(await res.text())
			return res.json()
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ['clarifications', id] })
	})

	return (
		<OpportunityShell active="clarifications">
			<div className="p-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Clarifications</h2>
					<div className="flex flex-wrap items-center gap-2">
						<input
							type="file"
							accept=".csv"
							onChange={e => {
								const f = e.target.files?.[0]
								if (f) importCsv.mutate(f)
							}}
						/>
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={() => setShowAdd(true)}
						>
							+ Add Question
						</button>
						<button
							className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
							onClick={() => downloadWithAuth(`${API}/clarifications/${id}/export.csv`, `clarifications-${id}.csv`)}
						>
							Export CSV
						</button>
						{importCsv.isPending && <span className="text-xs text-slate-600">Importing...</span>}
						{importCsv.error && (
							<span className="text-xs text-red-600">{(importCsv.error as Error).message}</span>
						)}
					</div>
				</div>

				{showAdd && (
					<div className="mt-4 rounded border bg-white p-4 shadow-sm">
						<h3 className="font-medium">New Question</h3>
						<div className="mt-2 grid gap-3 sm:grid-cols-2">
							<div>
								<label className="block text-sm font-medium">Question No</label>
								<input
									className="mt-1 w-full rounded border p-2"
									placeholder="e.g. Q1, Q2.1"
									value={newQ.questionNo}
									onChange={e => setNewQ({ ...newQ, questionNo: e.target.value })}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium">Status</label>
								<select
									className="mt-1 w-full rounded border p-2"
									value={newQ.status}
									onChange={e => setNewQ({ ...newQ, status: e.target.value })}
								>
									<option value="open">Open</option>
									<option value="submitted">Submitted</option>
									<option value="answered">Answered</option>
									<option value="closed">Closed</option>
								</select>
							</div>
							<div className="sm:col-span-2">
								<label className="block text-sm font-medium">Question Text</label>
								<textarea
									className="mt-1 w-full rounded border p-2"
									rows={3}
									placeholder="Enter your question..."
									value={newQ.text}
									onChange={e => setNewQ({ ...newQ, text: e.target.value })}
								/>
							</div>
						</div>
						<div className="mt-3 flex gap-2">
							<button
								className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
								onClick={() => addQuestion.mutate()}
								disabled={!newQ.questionNo || !newQ.text || addQuestion.isPending}
							>
								{addQuestion.isPending ? 'Saving...' : 'Save'}
							</button>
							<button
								className="rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
								onClick={() => setShowAdd(false)}
								disabled={addQuestion.isPending}
							>
								Cancel
							</button>
						</div>
					</div>
				)}

				{list.isLoading ? (
					<p className="mt-4 text-sm text-slate-600">Loading...</p>
				) : list.data?.length === 0 ? (
					<p className="mt-4 text-sm text-slate-600">No clarifications yet. Add your first question.</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100">
								<tr>
									<th className="px-3 py-2 text-left">No</th>
									<th className="px-3 py-2 text-left">Question</th>
									<th className="px-3 py-2 text-left">Status</th>
									<th className="px-3 py-2 text-left">Response</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{list.data?.map(r => (
									<tr key={r.id} className="border-t align-top">
										<td className="px-3 py-2 font-mono text-xs">{r.questionNo}</td>
										<td className="max-w-md px-3 py-2 whitespace-pre-wrap">{r.text}</td>
										<td className="px-3 py-2">
											<select
												className="rounded border p-1 text-xs"
												defaultValue={r.status || 'open'}
												onChange={e => (r.status = e.target.value)}
											>
												<option value="open">Open</option>
												<option value="submitted">Submitted</option>
												<option value="answered">Answered</option>
												<option value="closed">Closed</option>
											</select>
										</td>
										<td className="px-3 py-2">
											<textarea
												className="w-64 rounded border p-1 text-xs"
												rows={2}
												placeholder="Response text..."
												defaultValue={r.responseText || ''}
												onChange={e => (r.responseText = e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<button
												className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
												onClick={() => updateRow.mutate(r)}
												disabled={updateRow.isPending}
											>
												Save
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</OpportunityShell>
	)
}
