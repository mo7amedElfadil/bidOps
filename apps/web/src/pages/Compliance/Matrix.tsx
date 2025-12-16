import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { OpportunityShell } from '../../components/OpportunityShell'
import { getToken } from '../../utils/auth'

type Clause = {
	id: string
	clauseNo?: string
	section?: string
	mandatoryFlag: boolean
	requirementText: string
	response?: string
	status?: string
	owner?: string
	evidence?: string
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function fetchCompliance(id?: string) {
	const token = getToken()
	const res = await fetch(`${API}/compliance/${id}`, {
		headers: token ? { Authorization: `Bearer ${token}` } : undefined
	})
	if (!res.ok) throw new Error(await res.text())
	return (await res.json()) as Clause[]
}

export default function ComplianceMatrix() {
	const { id } = useParams()
	const list = useQuery({
		queryKey: ['compliance', id],
		enabled: Boolean(id),
		queryFn: () => fetchCompliance(id)
	})

	const importMutation = useMutation({
		mutationFn: async (file: File) => {
			const fd = new FormData()
			fd.append('file', file)
			const token = getToken()
			const res = await fetch(`${API}/compliance/${id}/import`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: fd
			})
			if (!res.ok) throw new Error(await res.text())
			return res.json()
		},
		onSuccess: () => list.refetch()
	})

	const saveRow = useMutation({
		mutationFn: async (r: Clause) => {
			const token = getToken()
			const res = await fetch(`${API}/compliance/${r.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify({
					response: r.response,
					status: r.status,
					owner: r.owner,
					evidence: r.evidence
				})
			})
			if (!res.ok) throw new Error(await res.text())
			return res.json()
		},
		onSuccess: () => list.refetch()
	})

	return (
		<OpportunityShell active="compliance">
			<div className="p-4">
				<div className="flex flex-wrap items-center gap-2">
					<input
						type="file"
						accept=".pdf"
						onChange={e => {
							const f = e.target.files?.[0]
							if (f) importMutation.mutate(f)
						}}
					/>
					<a
						className="rounded bg-gray-700 px-3 py-1.5 text-white"
						href={`${API}/compliance/${id}/export.csv`}
						target="_blank"
						rel="noreferrer"
					>
						Export CSV
					</a>
					{importMutation.isPending && <span className="text-sm text-slate-600">Importing...</span>}
					{importMutation.error && (
						<span className="text-sm text-red-600">{(importMutation.error as Error).message}</span>
					)}
				</div>

				{list.isLoading ? (
					<p className="mt-4 text-sm text-gray-600">Loading...</p>
				) : list.error ? (
					<p className="mt-4 text-sm text-red-600">
						{(list.error as Error).message || 'Failed to load clauses'}
					</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-white">
						<table className="min-w-full text-sm">
							<thead className="bg-gray-100">
								<tr>
									<th className="px-3 py-2 text-left">No</th>
									<th className="px-3 py-2 text-left">Mandatory</th>
									<th className="px-3 py-2 text-left">Requirement</th>
									<th className="px-3 py-2 text-left">Response</th>
									<th className="px-3 py-2 text-left">Status</th>
									<th className="px-3 py-2 text-left">Owner</th>
									<th className="px-3 py-2 text-left">Evidence</th>
									<th className="px-3 py-2 text-left"></th>
								</tr>
							</thead>
							<tbody>
								{list.data?.map(r => (
									<tr key={r.id} className="border-t align-top">
										<td className="px-3 py-2">{r.clauseNo || '-'}</td>
										<td className="px-3 py-2">{r.mandatoryFlag ? 'Yes' : 'No'}</td>
										<td className="px-3 py-2 max-w-xl whitespace-pre-wrap">{r.requirementText}</td>
										<td className="px-3 py-2">
											<textarea
												className="w-64 rounded border p-1"
												defaultValue={r.response || ''}
												onChange={e => (r.response = e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<select
												className="rounded border p-1"
												defaultValue={r.status || ''}
												onChange={e => (r.status = e.target.value)}
											>
												<option value=""></option>
												<option value="compliant">compliant</option>
												<option value="partial">partial</option>
												<option value="non-compliant">non-compliant</option>
												<option value="tbd">tbd</option>
											</select>
										</td>
										<td className="px-3 py-2">
											<input
												className="w-40 rounded border p-1"
												defaultValue={r.owner || ''}
												onChange={e => (r.owner = e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<input
												className="w-60 rounded border p-1"
												defaultValue={r.evidence || ''}
												onChange={e => (r.evidence = e.target.value)}
											/>
										</td>
										<td className="px-3 py-2">
											<button
												className="rounded bg-green-600 px-2 py-1 text-white"
												onClick={() => saveRow.mutate(r)}
												disabled={saveRow.isPending}
											>
												Save
											</button>
										</td>
									</tr>
								))}
								{list.data?.length === 0 && (
									<tr>
										<td colSpan={8} className="px-3 py-4 text-center text-slate-500">
											No clauses loaded. Import a PDF to begin.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</OpportunityShell>
	)
}


