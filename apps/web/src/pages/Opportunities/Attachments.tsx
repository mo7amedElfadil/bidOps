import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import UploadButton from '../../components/UploadButton'
import { OpportunityShell } from '../../components/OpportunityShell'
import { getToken } from '../../utils/auth'
import { toast } from '../../utils/toast'
import { api } from '../../api/client'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import PaginationControls from '../../components/PaginationControls'

type Row = {
	id: string
	filename: string
	size: number
	hash: string
	storagePath: string
	createdAt: string
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function fetchAttachments(id?: string, page = 1, pageSize = 25): Promise<{ items: Row[]; total: number; page: number; pageSize: number }> {
	const token = getToken()
	const res = await fetch(
		`${API}/attachments?entityType=Opportunity&entityId=${id}&page=${page}&pageSize=${pageSize}`,
		{
		headers: token ? { Authorization: `Bearer ${token}` } : undefined
		}
	)
	if (!res.ok) throw new Error(await res.text())
	return res.json()
}

export default function AttachmentsPage() {
	const { id } = useParams()
	const [page, setPage] = useState(1)
	const [pageSize] = useState(25)
	const [selected, setSelected] = useState<Record<string, boolean>>({})
	const [prompt, setPrompt] = useState('')
	const [provider, setProvider] = useState<'openai' | 'gemini'>('openai')
	const [outputs, setOutputs] = useState({ compliance: true, clarifications: true, proposal: true })
	const [result, setResult] = useState<string | null>(null)

	const list = useQuery({
		queryKey: ['attachments', id, page, pageSize],
		enabled: Boolean(id),
		queryFn: () => fetchAttachments(id, page, pageSize)
	})

	const proposalSections = useQuery({
		queryKey: ['proposal-sections', id],
		enabled: Boolean(id),
		queryFn: () => api.listProposalSections(id || '')
	})

	useEffect(() => {
		if (list.error) {
			toast.error((list.error as Error).message || 'Failed to load attachments')
		}
	}, [list.error])
	const upload = useMutation({
		mutationFn: async (file: File) => {
			const fd = new FormData()
			fd.append('file', file)
			fd.append('entityType', 'Opportunity')
			fd.append('entityId', id || '')
			const token = getToken()
			const res = await fetch(`${API}/attachments`, {
				method: 'POST',
				body: fd,
				headers: token ? { Authorization: `Bearer ${token}` } : undefined
			})
			if (!res.ok) throw new Error(await res.text())
			return res.json()
		},
		onSuccess: () => list.refetch(),
		onError: (err: any) => {
			toast.error(err.message || 'Upload failed')
		}
	})

	const runAi = useMutation({
		mutationFn: () => {
			const attachmentIds = Object.entries(selected)
				.filter(([, checked]) => checked)
				.map(([key]) => key)
			if (!attachmentIds.length) {
				throw new Error('Select at least one attachment')
			}
			return api.runAiExtract({
				opportunityId: id || '',
				attachmentIds,
				prompt,
				provider,
				outputs
			})
		},
		onSuccess: data => {
			const summary = `Compliance: ${data.complianceCreated}, Clarifications: ${data.clarificationsCreated}, Proposal Sections: ${data.proposalCreated}`
			setResult(data.unsupported?.length ? `${summary} (Skipped: ${data.unsupported.join(', ')})` : summary)
			proposalSections.refetch()
		},
		onError: (err: any) => toast.error(err.message || 'AI extraction failed')
	})

	async function downloadAttachment(row: Row) {
		const token = getToken()
		const res = await fetch(`${API}/attachments/${row.id}/download`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined
		})
		if (!res.ok) {
			toast.error('Download failed')
			return
		}
		const blob = await res.blob()
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = row.filename
		link.click()
		URL.revokeObjectURL(url)
	}

	return (
		<OpportunityShell active="attachments">
			<div className="space-y-4 p-4">
				<div className="flex flex-wrap items-center gap-3">
					<UploadButton
						label="Upload attachment"
						onFile={fileOrList => {
							const file = fileOrList instanceof File ? fileOrList : fileOrList?.[0]
							if (file) upload.mutate(file)
						}}
					/>
					{upload.isPending && <span className="text-sm text-muted-foreground">Uploading...</span>}
					{upload.error && (
						<span className="text-sm text-destructive">
							{(upload.error as Error).message || 'Upload failed'}
						</span>
					)}
				</div>

				<Card>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="text-sm font-semibold">AI Extraction</h3>
							<p className="text-xs text-muted-foreground">
								Select attachments, enter a prompt, and generate compliance, clarifications, or proposal sections.
							</p>
						</div>
						<Button size="sm" variant="primary" onClick={() => runAi.mutate()} disabled={runAi.isPending || !prompt.trim()}>
							{runAi.isPending ? 'Running...' : 'Run Extraction'}
						</Button>
					</div>
					<div className="mt-3 grid gap-3 md:grid-cols-3">
						<label className="text-xs font-medium">
							Provider
							<select
								className="mt-1 w-full rounded border border-border p-2 text-sm"
								value={provider}
								onChange={e => setProvider(e.target.value as 'openai' | 'gemini')}
							>
								<option value="openai">OpenAI</option>
								<option value="gemini">Gemini</option>
							</select>
						</label>
						<label className="text-xs font-medium md:col-span-2">
							Prompt
							<textarea
								className="mt-1 min-h-[120px] w-full rounded border border-border p-2 text-sm"
								value={prompt}
								onChange={e => setPrompt(e.target.value)}
								placeholder="Provide detailed guidance for the AI extraction..."
							/>
						</label>
					</div>
					<div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={outputs.compliance}
								onChange={e => setOutputs({ ...outputs, compliance: e.target.checked })}
							/>
							Compliance
						</label>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={outputs.clarifications}
								onChange={e => setOutputs({ ...outputs, clarifications: e.target.checked })}
							/>
							Clarifications
						</label>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={outputs.proposal}
								onChange={e => setOutputs({ ...outputs, proposal: e.target.checked })}
							/>
							Proposal Sections
						</label>
						{result && <span className="text-xs text-green-600">{result}</span>}
					</div>
					<p className="mt-2 text-xs text-muted-foreground">
						Supported parsing: PDF, TXT, MD, CSV. Other formats are stored but may be skipped.
					</p>
				</Card>

				{list.isLoading ? (
					<p className="mt-4 text-sm text-muted-foreground">Loading attachments...</p>
				) : list.error ? (
					<p className="mt-4 text-sm text-destructive">
						{(list.error as Error).message || 'Failed to load attachments'}
					</p>
				) : (
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-muted">
								<tr>
									<th className="px-3 py-2 text-left">Use</th>
									<th className="px-3 py-2 text-left">File</th>
									<th className="px-3 py-2 text-left">Size</th>
									<th className="px-3 py-2 text-left">Uploaded</th>
									<th className="px-3 py-2 text-left">Hash</th>
									<th className="px-3 py-2 text-left">Actions</th>
								</tr>
							</thead>
							<tbody>
								{list.data?.items?.map(r => (
									<tr key={r.id} className="border-t">
										<td className="px-3 py-2">
											<input
												type="checkbox"
												checked={Boolean(selected[r.id])}
												onChange={e => setSelected({ ...selected, [r.id]: e.target.checked })}
											/>
										</td>
										<td className="px-3 py-2">{r.filename}</td>
										<td className="px-3 py-2">{(r.size / 1024).toFixed(1)} KB</td>
										<td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
										<td className="px-3 py-2 font-mono text-xs">{r.hash || '—'}</td>
										<td className="px-3 py-2">
											<button
												className="text-xs text-accent hover:underline"
												onClick={() => downloadAttachment(r)}
											>
												Download
											</button>
										</td>
									</tr>
								))}
								{list.data?.items?.length === 0 && (
									<tr>
										<td colSpan={6} className="px-3 py-3 text-center text-muted-foreground">
											No attachments yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
						{list.data && list.data.total > 0 && (
							<div className="mt-3">
								<PaginationControls
									page={list.data.page}
									pageSize={list.data.pageSize}
									total={list.data.total}
									onPageChange={setPage}
									disabled={list.isLoading}
								/>
							</div>
						)}
					</div>
				)}

				<div className="mt-6 rounded border bg-card p-4 shadow-sm">
					<h3 className="text-sm font-semibold">Proposal Draft Sections</h3>
					{proposalSections.isLoading ? (
						<p className="mt-2 text-xs text-muted-foreground">Loading proposal draft...</p>
					) : proposalSections.data?.length ? (
						<div className="mt-3 space-y-3 text-sm">
							{proposalSections.data.map(section => (
								<div key={section.id} className="rounded border p-3">
									<p className="text-xs text-muted-foreground">
										{section.sectionNo ? `${section.sectionNo}. ` : ''}{section.title}
									</p>
									<p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{section.content}</p>
								</div>
							))}
						</div>
					) : (
						<p className="mt-2 text-xs text-muted-foreground">No draft sections yet.</p>
					)}
				</div>
			</div>
		</OpportunityShell>
	)
}
