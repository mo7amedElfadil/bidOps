import { useMutation } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { OpportunityShell } from '../../components/OpportunityShell'

export default function SubmissionPage() {
	const { id } = useParams<{ id: string }>()

	const buildPack = useMutation({
		mutationFn: () => api.buildSubmissionPack(id || '')
	})

	const result = buildPack.data
	const manifestUrl = result?.path?.startsWith('http') ? result.path : undefined

	return (
		<OpportunityShell active="submission">
			<div className="p-6">
				<div className="rounded border bg-card p-6 shadow-sm">
					<p className="text-sm text-muted-foreground">
						Generate a submission pack containing all attachments for this opportunity. The pack will
						include a manifest file with checksums for verification.
					</p>

					<div className="mt-4">
						<button
							className="rounded bg-green-600 px-4 py-2 text-primary-foreground hover:bg-green-600/90 disabled:opacity-50"
							onClick={() => buildPack.mutate()}
							disabled={buildPack.isPending}
						>
							{buildPack.isPending ? 'Building...' : 'Build Submission Pack'}
						</button>
					</div>

					{buildPack.error && (
						<div className="mt-4 rounded bg-red-50 p-4 text-sm text-red-700">
							{(buildPack.error as Error).message || 'Failed to build pack'}
						</div>
					)}

					{result && (
						<div className="mt-4 rounded bg-green-50 p-4">
							<h3 className="font-medium text-green-800">Pack Generated Successfully</h3>
							<dl className="mt-2 text-sm">
								<div className="flex justify-between border-b border-green-200 py-2">
									<dt className="text-green-700">Files Included</dt>
									<dd className="font-mono">{result.count}</dd>
								</div>
								<div className="flex justify-between border-b border-green-200 py-2">
									<dt className="text-green-700">Storage Path</dt>
									<dd className="font-mono text-xs">{result.path}</dd>
								</div>
								<div className="flex justify-between py-2">
									<dt className="text-green-700">Checksum (SHA-256)</dt>
									<dd className="font-mono text-xs break-all">{result.checksum}</dd>
								</div>
								{manifestUrl && (
									<div className="flex justify-between py-2">
										<dt className="text-green-700">Download</dt>
										<dd>
											<a className="text-accent hover:underline" href={manifestUrl} target="_blank" rel="noreferrer">
												Open pack
											</a>
										</dd>
									</div>
								)}
							</dl>
						</div>
					)}

					<div className="mt-6 border-t pt-4">
						<h3 className="font-medium">What's included in the pack?</h3>
						<ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
							<li>All attachments uploaded to this opportunity</li>
							<li>
								A <code className="bg-muted px-1">manifest.json</code> file with file metadata
							</li>
							<li>SHA-256 checksums for each file</li>
							<li>Use the checksum to verify integrity after download</li>
						</ul>
					</div>

					<div className="mt-4 rounded bg-amber-50 p-4 text-sm text-amber-600">
						<strong>Note:</strong> Ensure all approvals are complete before generating the final submission pack.
					</div>
				</div>
			</div>
		</OpportunityShell>
	)
}

