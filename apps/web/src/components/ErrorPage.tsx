import { Link, useRouteError } from 'react-router-dom'

export default function ErrorPage() {
	const error = useRouteError() as {
		message?: string
		statusText?: string
		status?: number
	}

	const title = error?.status ? `${error.status}` : 'Error'
	const message = error?.message || error?.statusText || 'Something went wrong. Please try again.'

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="mx-auto flex max-w-4xl flex-col items-start justify-center gap-4 p-6 text-base">
				<span className="text-sm font-semibold uppercase tracking-wide text-slate-500">BidOps</span>
				<h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
				<p className="text-slate-600">{message}</p>
				<div className="flex flex-wrap gap-3">
					<button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" onClick={() => window.location.reload()}>
						Reload
					</button>
					<Link className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300" to="/dashboard">
						Go Home
					</Link>
				</div>
				{error?.status && (
					<p className="text-xs uppercase tracking-wide text-slate-400">Status Code: {error.status}</p>
				)}
			</div>
		</div>
	)
}
