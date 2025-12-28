import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import UploadButton from '../../components/UploadButton'
import { OpportunityShell } from '../../components/OpportunityShell'
import { getToken } from '../../utils/auth'
import { downloadWithAuth } from '../../utils/download'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Heading from '../../components/ui/Heading'
import Input from '../../components/ui/Input'

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

	const importPdfMutation = useMutation({
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

	const importCsvMutation = useMutation({
		mutationFn: async (file: File) => {
			const fd = new FormData()
			fd.append('file', file)
			const token = getToken()
			const res = await fetch(`${API}/compliance/${id}/import.csv`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: fd
			})
			if (!res.ok) throw new Error(await res.text())
			return res.json()
		},
		onSuccess: () => list.refetch()
	})

	function handleUpload(fileOrList: File | FileList | null) {
		const file = fileOrList instanceof File ? fileOrList : fileOrList?.[0]
		if (!file) return
		const ext = file.name.split('.').pop()?.toLowerCase()
		if (ext === 'csv') {
			importCsvMutation.mutate(file)
		} else {
			importPdfMutation.mutate(file)
		}
	}

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
			<div className="space-y-4 p-4">
				<Heading title="Compliance Matrix" subtitle="Capture verbatim requirements and responses." />
				<Card>
					<div className="flex flex-wrap items-center gap-3">
						<UploadButton accept=".pdf,.csv" label="Upload PDF/CSV" onFile={handleUpload} />
						<Button variant="secondary" onClick={() => downloadWithAuth(`${API}/compliance/${id}/export.csv`, `compliance-${id}.csv`)}>
							Export CSV
						</Button>
						{(importPdfMutation.isPending || importCsvMutation.isPending) && (
							<span className="text-sm text-muted-foreground">Importing...</span>
						)}
					</div>
					<div className="mt-2 flex flex-wrap gap-3">
						{importPdfMutation.error && (
							<span className="text-sm text-destructive">{(importPdfMutation.error as Error).message}</span>
						)}
						{importCsvMutation.error && (
							<span className="text-sm text-destructive">{(importCsvMutation.error as Error).message}</span>
						)}
					</div>
				</Card>

				{list.isLoading ? (
					<p className="mt-4 text-sm text-muted-foreground">Loading...</p>
				) : list.error ? (
					<p className="mt-4 text-sm text-destructive">
						{(list.error as Error).message || 'Failed to load clauses'}
					</p>
				) : (
					<div className="mt-4 overflow-x-auto rounded border bg-card">
						<table className="min-w-full text-sm">
							<thead className="bg-muted">
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
												className="w-full rounded border border-border px-2 py-1 text-sm"
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
											<Input
												defaultValue={r.owner || ''}
												onChange={e => (r.owner = e.target.value)}
												className="w-40"
											/>
										</td>
										<td className="px-3 py-2">
											<Input
												defaultValue={r.evidence || ''}
												onChange={e => (r.evidence = e.target.value)}
												className="w-60"
											/>
										</td>
										<td className="px-3 py-2">
											<Button size="sm" variant="primary" onClick={() => saveRow.mutate(r)} disabled={saveRow.isPending}>
												Save
											</Button>
										</td>
									</tr>
								))}
								{list.data?.length === 0 && (
									<tr>
										<td colSpan={8} className="px-3 py-4 text-center text-muted-foreground">
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
