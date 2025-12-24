import { useState } from 'react'
import UploadButton from '../../components/UploadButton'
import { Page } from '../../components/Page'
import { ImportIssue } from '../../api/client'
import { toast } from '../../utils/toast'
import { getToken } from '../../utils/auth'

type Step = 'upload' | 'map' | 'preview'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function TrackerWizard() {
	const [step, setStep] = useState<Step>('upload')
	const [file, setFile] = useState<File | null>(null)
	const [headers, setHeaders] = useState<string[]>([])
	const [rows, setRows] = useState<string[][]>([])
	const [message, setMessage] = useState<string | null>(null)
	const [issues, setIssues] = useState<ImportIssue[]>([])

	function parseCsv(text: string) {
		const lines = text.split(/\r?\n/).filter(Boolean)
		if (!lines.length) return
		const head = lines[0].split(',')
		const body = lines.slice(1).map(l => l.split(','))
		setHeaders(head)
		setRows(body)
	}

	function handleUpload(fileOrList: File | FileList | null) {
		const f = fileOrList instanceof File ? fileOrList : fileOrList?.[0]
		if (!f) return
		setFile(f)
		f.text().then(text => {
			parseCsv(text)
			setStep('map')
		})
	}

	async function submitImport() {
		if (!file) return
		const form = new FormData()
		form.append('file', file)
		try {
			const token = getToken()
			const res = await fetch(`${API_BASE}/import/tracker`, {
				method: 'POST',
				body: form,
				headers: token ? { Authorization: `Bearer ${token}` } : undefined
			})
			if (!res.ok) throw new Error(await res.text())
			const payload = await res.json()
			setIssues(payload?.issues || [])
			setMessage(
				payload?.issues?.length
					? `Import submitted with ${payload.issues.length} issues. Invalid values were left empty.`
					: 'Import submitted with no issues.'
			)
		} catch (err: any) {
			toast.error(err.message || 'Import failed')
		}
	}

	const requiredColumns = [
		'Sno',
		'Customer',
		'Tender Details',
		'Description',
		'Target Submission date',
		'Submission Date',
		'Notes',
		'Status',
		'Business Owner',
		'Bid Owner',
		'Tender Bond Readiness',
		'Tender Value',
		'Validity',
		'Mode of Submission',
		'Days left',
		'Reformatted Date',
		'Rank',
		'N/A'
	]

	return (
		<Page title="Tracker Import Wizard" subtitle="Upload CSV, confirm headers, and submit to import opportunities.">
			{step === 'upload' && (
				<div className="mt-4">
					<div className="flex items-center gap-3 text-sm text-slate-600">
						<UploadButton accept=".csv" label="Upload tracker CSV" onFile={handleUpload} />
					</div>
				</div>
			)}
			{step === 'map' && (
				<div className="mt-4">
					<p className="text-sm text-gray-600">Detected columns:</p>
					<ul className="mt-2 list-inside list-disc text-sm">
						{headers.map(h => (
							<li key={h}>{h}</li>
						))}
					</ul>
					<button
						className="mt-4 rounded bg-blue-600 px-3 py-1.5 text-white"
						onClick={() => setStep('preview')}
					>
						Next: Preview
					</button>
				</div>
			)}
			{step === 'preview' && (
				<div className="mt-4 overflow-x-auto rounded border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-100">
							<tr>
								{headers.map(h => (
									<th key={h} className="px-3 py-2 text-left">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.slice(0, 10).map((r, i) => (
								<tr key={i} className="border-t">
									{r.map((c, j) => (
										<td key={j} className="px-3 py-2">
											{c}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
					<div className="p-3">
						<button className="rounded bg-blue-600 px-3 py-1.5 text-white" onClick={submitImport}>
							Import
						</button>
						{message && <p className="mt-2 text-sm text-green-700">{message}</p>}
						{issues.length > 0 && (
							<div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
								<p className="font-medium">Fields needing attention</p>
								<p className="mt-1 text-amber-800">
									Fix these in the opportunity details. They will disappear once updated.
								</p>
								<ul className="mt-2 space-y-2">
									{issues.map(issue => (
										<li key={issue.id} className="rounded border border-amber-200 bg-white p-2">
											<p className="font-medium">
												Row {issue.rowIndex} • {issue.columnName || issue.fieldName}
											</p>
											<p className="text-amber-800">
												{issue.message} {issue.rawValue ? `(${issue.rawValue})` : ''}
											</p>
										</li>
									))}
								</ul>
							</div>
						)}
						<span
							className="cursor-help rounded-full border px-2 py-0.5 text-xs text-slate-600"
							title={`Expected headers (from the example CSV): ${requiredColumns.join(', ')}`}
						>
							?
						</span>
					</div>
				</div>
			)}
		</Page>
	)
}
