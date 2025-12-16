import { useState } from 'react'
import { Page } from '../../components/Page'

type Step = 'upload' | 'map' | 'preview'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function TrackerWizard() {
	const [step, setStep] = useState<Step>('upload')
	const [file, setFile] = useState<File | null>(null)
	const [headers, setHeaders] = useState<string[]>([])
	const [rows, setRows] = useState<string[][]>([])
	const [message, setMessage] = useState<string | null>(null)

	function parseCsv(text: string) {
		const lines = text.split(/\r?\n/).filter(Boolean)
		if (!lines.length) return
		const head = lines[0].split(',')
		const body = lines.slice(1).map(l => l.split(','))
		setHeaders(head)
		setRows(body)
	}

	async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0]
		if (!f) return
		setFile(f)
		const text = await f.text()
		parseCsv(text)
		setStep('map')
	}

	async function submitImport() {
		if (!file) return
		const form = new FormData()
		form.append('file', file)
		await fetch(`${API_BASE}/import/tracker`, { method: 'POST', body: form })
		setMessage('Import submitted')
	}

	return (
		<Page title="Tracker Import Wizard" subtitle="Upload CSV, confirm headers, and submit to import opportunities.">
			{step === 'upload' && (
				<div className="mt-4">
					<input type="file" accept=".csv" onChange={onUpload} />
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
					</div>
				</div>
			)}
		</Page>
	)
}
