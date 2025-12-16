import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { OpportunityShell } from '../../components/OpportunityShell'
import { getToken } from '../../utils/auth'

type Row = {
	id: string
	filename: string
	size: number
	hash: string
	storagePath: string
	createdAt: string
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function fetchAttachments(id?: string): Promise<Row[]> {
	const token = getToken()
	const res = await fetch(`${API}/attachments?entityType=Opportunity&entityId=${id}`, {
		headers: token ? { Authorization: `Bearer ${token}` } : undefined
	})
	if (!res.ok) throw new Error(await res.text())
	return res.json()
}

export default function AttachmentsPage() {
	const { id } = useParams()
	const list = useQuery({
		queryKey: ['attachments', id],
		enabled: Boolean(id),
		queryFn: () => fetchAttachments(id)
	})

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
		onSuccess: () => list.refetch()
	})

	return (
		<OpportunityShell active="attachments">
			<div className="p-4">
				<div className="flex flex-wrap items-center gap-3">
					<input
						type="file"
						onChange={e => {
							const f = e.target.files?.[0]
							if (f) upload.mutate(f)
						}}
					/>
					{upload.isPending && <span className="text-sm text-slate-600">Uploading...</span>}
					{upload.error && (
						<span className="text-sm text-red-600">
							{(upload.error as Error).message || 'Upload failed'}
						</span>
					)}
				</div>

				{list.isLoading ? (
					<p className="mt-4 text-sm text-slate-600">Loading attachments...</p>
				) : list.error ? (
					<p className="mt-4 text-sm text-red-600">
						{(list.error as Error).message || 'Failed to load attachments'}
					</p>
				) : (
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="bg-gray-100">
								<tr>
									<th className="px-3 py-2 text-left">File</th>
									<th className="px-3 py-2 text-left">Size</th>
									<th className="px-3 py-2 text-left">Uploaded</th>
									<th className="px-3 py-2 text-left">Hash</th>
								</tr>
							</thead>
							<tbody>
								{list.data?.map(r => (
									<tr key={r.id} className="border-t">
										<td className="px-3 py-2">{r.filename}</td>
										<td className="px-3 py-2">{(r.size / 1024).toFixed(1)} KB</td>
										<td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
										<td className="px-3 py-2 font-mono text-xs">{r.hash || '—'}</td>
									</tr>
								))}
								{list.data?.length === 0 && (
									<tr>
										<td colSpan={4} className="px-3 py-3 text-center text-slate-500">
											No attachments yet.
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


